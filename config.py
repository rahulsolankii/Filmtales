import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    TMDB_API_KEY = os.getenv('TMDB_API_KEY')
    TMDB_BASE_URL = 'https://api.themoviedb.org/3'
    TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'
    
    # Mood to genre mapping with weights
    MOOD_TO_GENRES = {
        'happy': {
            'genres': [35, 10402, 10751],  # Comedy, Music, Family
            'weights': [5, 3, 2],  # How many movies from each genre
            'min_movies': 68,
            'max_movies': 72
        },
        'sad': {
            'genres': [18, 10749, 9648],  # Drama, Romance, Mystery
            'weights': [5, 3, 2],
            'min_movies': 58,
            'max_movies': 62
        },
        'excited': {
            'genres': [28, 12, 878],  # Action, Adventure, Sci-Fi
            'weights': [5, 3, 2],
            'min_movies': 48,
            'max_movies': 52
        },
        'relaxed': {
            'genres': [14, 16, 36],  # Fantasy, Animation, History
            'weights': [4, 4, 2],
            'min_movies': 46,
            'max_movies': 50
        },
        'adventurous': {
            'genres': [12, 28, 10752],  # Adventure, Action, War
            'weights': [5, 3, 2],
            'min_movies': 48,
            'max_movies': 52
        },
        'romantic': {
            'genres': [10749, 10402, 35],  # Romance, Music, Comedy
            'weights': [5, 3, 2],
            'min_movies': 48,
            'max_movies': 55
        },
        'inspired': {
            'genres': [99, 36, 18],  # Documentary, History, Drama
            'weights': [4, 3, 3],
            'min_movies': 46,
            'max_movies': 55
        },
        'scared': {
            'genres': [27, 53, 9648],  # Horror, Thriller, Mystery
            'weights': [5, 3, 2],
            'min_movies': 48,
            'max_movies': 60
        },
        'thoughtful': {
            'genres': [18, 878, 9648],  # Drama, Sci-Fi, Mystery
            'weights': [4, 3, 3],
            'min_movies': 45,
            'max_movies': 50
        }
    }
    
    # Streaming provider IDs (for TMDb watch provider API)
    STREAMING_PROVIDERS = {
        'Netflix': 8,
        'Amazon Prime Video': 119,
        'Disney Plus': 337,
        'Hulu': 15,
        'HBO Max': 384,
        'Apple TV Plus': 350,
        'Paramount Plus': 531,
        'Peacock': 386,
        'YouTube Premium': 188
    }
    
    # Country code for streaming availability (US = United States)
    COUNTRY_CODE = 'IN'