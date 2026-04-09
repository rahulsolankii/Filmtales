from flask import Flask, render_template, request, jsonify
import random
from utils.movie_fetcher import MovieFetcher
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

# Initialize movie fetcher
movie_fetcher = MovieFetcher()
print(f"Loaded TMDB API KEY: {Config.TMDB_API_KEY[:5]}...") # Log first few chars

# Available moods with professional curation
MOODS = [
    {'id': 'happy', 'name': 'Joyful 😊', 'color': '#facc15', 'icon': 'fa-smile'},
    {'id': 'sad', 'name': 'Melancholic 😢', 'color': '#60a5fa', 'icon': 'fa-sad-tear'},
    {'id': 'excited', 'name': 'Energetic 🤩', 'color': '#fb923c', 'icon': 'fa-bolt'},
    {'id': 'relaxed', 'name': 'Peaceful 😌', 'color': '#4ade80', 'icon': 'fa-leaf'},
    {'id': 'adventurous', 'name': 'Adventurous 🗺️', 'color': '#c084fc', 'icon': 'fa-compass'},
    {'id': 'romantic', 'name': 'Romantic 💖', 'color': '#f472b6', 'icon': 'fa-heart'},
    {'id': 'inspired', 'name': 'Inspired ✨', 'color': '#2dd4bf', 'icon': 'fa-lightbulb'},
    {'id': 'scared', 'name': 'Thrilling 😨', 'color': '#f87171', 'icon': 'fa-ghost'},
    {'id': 'thoughtful', 'name': 'Contemplative 🤔', 'color': '#94a3b8', 'icon': 'fa-brain'}
]

@app.route('/favicon.ico')
def favicon():
    return '', 204

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html', moods=MOODS)

@app.route('/get_recommendations', methods=['POST'])
def get_recommendations():
    """Get movie recommendations based on mood"""
    try:
        data = request.get_json()
        mood = data.get('mood', 'happy')
        
        # Get movies based on mood
        movies = movie_fetcher.fetch_movies_by_mood(mood)
        
        if movies:
            # Sort by rating (highest first)
            movies.sort(key=lambda x: x.get('rating', 0), reverse=True)
            
            # Add mood-specific color
            mood_color = next((m['color'] for m in MOODS if m['id'] == mood), '#FFD700')
            for movie in movies:
                movie['mood_color'] = mood_color
            
            return jsonify({
                'success': True,
                'mood': mood,
                'mood_name': next((m['name'] for m in MOODS if m['id'] == mood), 'Happy'),
                'movies': movies,
                'count': len(movies),
                'genre_info': f"Movies from {len(movies)} different genres matching your mood"
            })
        else:
            return jsonify({
                'success': False,
                'error': 'No movies found',
                'movies': []
            })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'movies': []
        })

@app.route('/get_movie_details/<int:movie_id>')
def get_movie_details(movie_id):
    """Get detailed information for a specific movie"""
    try:
        details = movie_fetcher.get_movie_details(movie_id)
        if details:
            return jsonify({'success': True, 'details': details})
        else:
            return jsonify({'success': False, 'error': 'Movie not found'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/get_streaming_info/<int:movie_id>')
def get_streaming_info(movie_id):
    """Get streaming information for a movie"""
    try:
        providers = movie_fetcher._get_streaming_providers(movie_id)
        return jsonify({'success': True, 'providers': providers})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/get_random_mood_movies')
def get_random_mood_movies():
    """Get movies for a random mood (for initial load)"""
    random_mood = random.choice(['happy', 'excited', 'romantic', 'adventurous'])
    
    movies = movie_fetcher.fetch_movies_by_mood(random_mood)
    if movies:
        movies.sort(key=lambda x: x.get('rating', 0), reverse=True)
        
        mood_color = next((m['color'] for m in MOODS if m['id'] == random_mood), '#FFD700')
        for movie in movies:
            movie['mood_color'] = mood_color
        
        return jsonify({
            'success': True,
            'mood': random_mood,
            'mood_name': next((m['name'] for m in MOODS if m['id'] == random_mood), 'Happy'),
            'movies': movies
        })
    else:
        return jsonify({
            'success': False,
            'error': 'No movies found'
        })

@app.route('/test_api')
def test_api():
    """Test the TMDb API key and return status"""
    try:
        import requests
        url = f"{Config.TMDB_BASE_URL}/discover/movie"
        params = {'api_key': Config.TMDB_API_KEY}
        r = requests.get(url, params=params)
        return jsonify({
            'status_code': r.status_code,
            'ok': r.ok,
            'api_key_loaded': Config.TMDB_API_KEY[:5] + "...",
            'first_movie': r.json().get('results', [])[0] if r.ok and r.json().get('results') else None
        })
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=False, port=5000)