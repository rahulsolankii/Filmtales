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
            'weights': [5, 3, 2],
            'min_movies': 40,
            'max_movies': 50
        },
        'sad': {
            'genres': [18, 10749, 9648],  # Drama, Romance, Mystery
            'weights': [5, 3, 2],
            'min_movies': 40,
            'max_movies': 50
        },
        'romantic': {
            'genres': [10749, 10402, 35],  # Romance, Music, Comedy
            'weights': [5, 3, 2],
            'min_movies': 40,
            'max_movies': 50
        },
        'action': {
            'genres': [28, 12, 878],  # Action, Adventure, Sci-Fi
            'weights': [5, 3, 2],
            'min_movies': 40,
            'max_movies': 50
        },
        'motivational': {
            'genres': [99, 18, 36],  # Documentary, Drama, History
            'weights': [4, 4, 2],
            'min_movies': 40,
            'max_movies': 50
        },
        'thriller': {
            'genres': [53, 80, 9648],  # Thriller, Crime, Mystery
            'weights': [5, 3, 2],
            'min_movies': 40,
            'max_movies': 50
        },
        'horror': {
            'genres': [27, 53, 9648],  # Horror, Thriller, Mystery
            'weights': [5, 3, 2],
            'min_movies': 40,
            'max_movies': 50
        },
        'calm': {
            'genres': [14, 16, 10751],  # Fantasy, Animation, Family
            'weights': [4, 4, 2],
            'min_movies': 40,
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