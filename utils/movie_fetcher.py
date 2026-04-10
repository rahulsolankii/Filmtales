import requests
import random
from config import Config
import math

class MovieFetcher:
    def __init__(self):
        self.api_key = Config.TMDB_API_KEY
        self.base_url = Config.TMDB_BASE_URL
        self.image_base_url = Config.TMDB_IMAGE_BASE_URL
        
    def fetch_movies_by_mood(self, mood, count=None):
        """Fetch movies based on mood with optimized single API call"""
        if mood not in Config.MOOD_TO_GENRES:
            mood = 'happy'
            
        mood_config = Config.MOOD_TO_GENRES[mood]
        
        if count is None:
            count = random.randint(mood_config['min_movies'], mood_config['max_movies'])
        
        try:
            # Combine genres using | (OR) operator for faster single API call
            genre_ids = "|".join(map(str, mood_config['genres']))
            
            url = f"{self.base_url}/discover/movie"
            params = {
                'api_key': self.api_key,
                'with_genres': genre_ids,
                'sort_by': 'popularity.desc',
                'language': 'en-US',
                'page': 1,
                'include_adult': False,
                'vote_count.gte': 100 # Filter for quality
            }
            
            response = requests.get(url, params=params, timeout=5)
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', [])
                all_movies = self._process_movie_results(results)
                
                # If we need more movies, fetch another page
                if len(all_movies) < count and data.get('total_pages', 1) > 1:
                    params['page'] = 2
                    response2 = requests.get(url, params=params, timeout=5)
                    if response2.status_code == 200:
                        results2 = response2.json().get('results', [])
                        all_movies.extend(self._process_movie_results(results2))
                
                # Shuffle and limit
                random.shuffle(all_movies)
                unique_movies = self._remove_duplicates(all_movies)
                
                # To ensure fast response, we skip fetching streaming/trailers for the list view.
                for movie in unique_movies[:count]:
                    movie['streaming'] = []
                    movie['trailer'] = None
                
                return unique_movies[:count]
            else:
                print(f"Error from TMDB API: {response.status_code}")
                return self._get_fallback_movies(mood, count)
            
        except Exception as e:
            print(f"Error fetching movies: {e}")
            return self._get_fallback_movies(mood, count)

    def _get_fallback_movies(self, mood, count):
        """Provide fallback data when API fails"""
        fallback_data = [
            {
                'id': 0,
                'title': 'The Shawshank Redemption',
                'year': '1994',
                'rating': 9.3,
                'description': 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
                'poster_url': f"{self.image_base_url}/q6y0GoS0vS9S9v9vS9v9vS9v9vS.jpg",
                'genre': 'Drama',
                'streaming': ['Netflix'],
                'trailer': None
            },
            {
                'id': 1,
                'title': 'Inception',
                'year': '2010',
                'rating': 8.8,
                'description': 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
                'poster_url': f"{self.image_base_url}/edv5CZv099MvS9v9vS9v9vS9v9v.jpg",
                'genre': 'Sci-Fi',
                'streaming': ['Amazon Prime'],
                'trailer': None
            }
        ]
        return fallback_data[:count] if count else fallback_data
    
    def _fetch_movies_by_genre(self, genre_id, count):
        """Fetch movies by specific genre"""
        try:
            url = f"{self.base_url}/discover/movie"
            params = {
                'api_key': self.api_key,
                'with_genres': genre_id,
                'sort_by': 'popularity.desc',
                'language': 'en-US',
                'page': 1,
                'include_adult': False
            }
            
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', [])
                processed = self._process_movie_results(results)
                return processed[:count]
            else:
                print(f"Error from TMDB API: {response.status_code}")
            
        except Exception as e:
            print(f"Error fetching genre {genre_id}: {e}")
        
        return []
    
    def _get_streaming_providers(self, movie_id):
        """Get streaming providers for a movie"""
        try:
            url = f"{self.base_url}/movie/{movie_id}/watch/providers"
            params = {
                'api_key': self.api_key
            }
            
            response = requests.get(url, params=params, timeout=5)
            if response.status_code == 200:
                data = response.json()
                
                # Get providers for the specified country
                providers_data = data.get('results', {}).get(Config.COUNTRY_CODE, {})
                flatrate = providers_data.get('flatrate', [])
                
                streaming_providers = []
                for provider in flatrate[:4]:  # Get top 4 providers
                    provider_name = provider.get('provider_name', '')
                    # Map to our known providers
                    for known_name, known_id in Config.STREAMING_PROVIDERS.items():
                        if known_name.lower() in provider_name.lower() or provider_name in known_name:
                            streaming_providers.append(known_name)
                            break
                    else:
                        streaming_providers.append(provider_name)
                
                return streaming_providers[:3]  # Return max 3 providers
                
        except Exception as e:
            print(f"Error fetching streaming providers: {e}")
        
        return []
    
    def _get_movie_trailer(self, movie_id):
        """Get YouTube trailer for a movie"""
        try:
            url = f"{self.base_url}/movie/{movie_id}/videos"
            params = {
                'api_key': self.api_key,
                'language': 'en-US'
            }
            
            response = requests.get(url, params=params, timeout=5)
            if response.status_code == 200:
                data = response.json()
                videos = data.get('results', [])
                
                # Look for official trailers
                for video in videos:
                    if video.get('type') == 'Trailer' and video.get('site') == 'YouTube':
                        return {
                            'key': video.get('key'),
                            'name': video.get('name', 'Trailer'),
                            'type': 'youtube'
                        }
                
                # If no trailer, look for any YouTube video
                for video in videos:
                    if video.get('site') == 'YouTube':
                        return {
                            'key': video.get('key'),
                            'name': video.get('name', 'Video'),
                            'type': 'youtube'
                        }
                        
        except Exception as e:
            print(f"Error fetching trailer: {e}")
        
        return None
    
    def _process_movie_results(self, results):
        """Process TMDb API results"""
        processed = []
        for movie in results:
            if movie.get('poster_path') and movie.get('overview'):
                processed.append({
                    'id': movie.get('id'),
                    'title': movie.get('title', 'Unknown Title'),
                    'year': movie.get('release_date', '')[:4] if movie.get('release_date') else 'N/A',
                    'rating': round(movie.get('vote_average', 0), 1),
                    'description': movie.get('overview', 'No description available.'),
                    'poster_url': f"{self.image_base_url}{movie.get('poster_path')}" if movie.get('poster_path') else None,
                    'genre': self._get_genre_names(movie.get('genre_ids', [])),
                    'popularity': movie.get('popularity', 0),
                    'streaming': [],  # Will be filled later
                    'trailer': None  # Will be filled later
                })
        return processed
    
    def _get_genre_names(self, genre_ids):
        """Get genre names from genre IDs"""
        genre_mapping = {
            28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
            80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
            14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
            9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
            10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
        }
        genres = [genre_mapping.get(gid, '') for gid in genre_ids[:3] if gid in genre_mapping]
        return ', '.join(genres) if genres else 'Not specified'
    
    def _remove_duplicates(self, movies):
        """Remove duplicate movies by title"""
        seen = set()
        unique_movies = []
        for movie in movies:
            if movie['title'] not in seen:
                seen.add(movie['title'])
                unique_movies.append(movie)
        return unique_movies
    
    def get_movie_details(self, movie_id):
        """Get detailed information for a specific movie"""
        try:
            url = f"{self.base_url}/movie/{movie_id}"
            params = {
                'api_key': self.api_key,
                'language': 'en-US',
                'append_to_response': 'videos,credits,watch/providers'
            }
            
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                movie = response.json()
                
                # Get streaming providers
                streaming = []
                providers_data = movie.get('watch/providers', {}).get('results', {}).get(Config.COUNTRY_CODE, {})
                flatrate = providers_data.get('flatrate', [])
                for provider in flatrate[:4]:
                    streaming.append(provider.get('provider_name', ''))
                
                # Get trailer
                trailer = None
                videos = movie.get('videos', {}).get('results', [])
                for video in videos:
                    if video.get('type') == 'Trailer' and video.get('site') == 'YouTube':
                        trailer = {
                            'key': video.get('key'),
                            'name': video.get('name', 'Trailer')
                        }
                        break
                
                return {
                    'title': movie.get('title'),
                    'overview': movie.get('overview'),
                    'release_date': movie.get('release_date'),
                    'runtime': movie.get('runtime'),
                    'rating': movie.get('vote_average'),
                    'poster_url': f"{self.image_base_url}{movie.get('poster_path', '')}" if movie.get('poster_path') else None,
                    'genres': [g['name'] for g in movie.get('genres', [])],
                    'tagline': movie.get('tagline', ''),
                    'streaming': streaming,
                    'trailer': trailer,
                    'director': self._get_director(movie.get('credits', {})),
                    'cast': self._get_top_cast(movie.get('credits', {}), 3)
                }
                
        except Exception as e:
            print(f"Error fetching movie details: {e}")
        
        return None
    
    def _get_director(self, credits):
        """Extract director from credits"""
        crew = credits.get('crew', [])
        for person in crew:
            if person.get('job') == 'Director':
                return person.get('name', '')
        return ''
    
    def _get_top_cast(self, credits, count=3):
        """Get top cast members"""
        cast = credits.get('cast', [])
        return [actor.get('name', '') for actor in cast[:count]]