import { db, collection, getDocs, query, where } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const moodCards = document.querySelectorAll('.mood-card');
    const moviesGrid = document.getElementById('moviesGrid');
    const loading = document.getElementById('loading');
    const noMovies = document.getElementById('noMovies');
    const refreshBtn = document.getElementById('refreshBtn');
    const currentMoodText = document.getElementById('currentMoodText');
    const moodEmoji = document.getElementById('moodEmoji');
    const selectedMoodDisplay = document.getElementById('selectedMoodDisplay');
    const movieModal = document.getElementById('movieModal');
    const closeBtn = document.querySelector('.close-btn');
    
    // Current state
    let currentMood = '';
    let currentMovies = [];
    
    // Initialize with random mood
    loadRandomMoodMovies();
    
    // Mood card click event
    moodCards.forEach(card => {
        card.addEventListener('click', function() {
            const mood = this.dataset.mood;
            selectMood(mood);
        });
    });
    
    // Refresh button click event
    refreshBtn.addEventListener('click', function() {
        if (currentMood) {
            loadMovies(currentMood);
        }
    });
    
    // Close modal when clicking X
    closeBtn.addEventListener('click', function() {
        movieModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === movieModal) {
            movieModal.style.display = 'none';
        }
    });
    
    // Functions
    function selectMood(mood) {
        // Update UI
        moodCards.forEach(card => {
            card.classList.remove('active');
            if (card.dataset.mood === mood) {
                card.classList.add('active');
            }
        });
        
        // Update current mood display
        currentMood = mood;
        const moodName = getMoodName(mood);
        const moodEmojiChar = getMoodEmoji(mood);
        
        currentMoodText.textContent = `Feeling ${moodName}?`;
        moodEmoji.textContent = moodEmojiChar;
        selectedMoodDisplay.textContent = `Movies for ${moodName} mood`;
        
        // Load movies for selected mood
        loadMovies(mood);
    }
    
    async function loadMovies(mood) {
        // Show loading, hide other sections
        loading.style.display = 'block';
        moviesGrid.style.display = 'none';
        noMovies.style.display = 'none';
        
        try {
            // 1. Fetch from TMDB API
            const apiPromise = fetch('/get_recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mood: mood })
            }).then(r => r.json());

            // 2. Fetch from Firestore
            const dbPromise = fetchFirestoreMovies(mood);

            // 3. MERGE BOTH
            const [apiData, dbMovies] = await Promise.all([apiPromise, dbPromise]);
            
            loading.style.display = 'none';

            let apiMovies = (apiData.success && apiData.movies) ? apiData.movies : [];
            const combinedMovies = [...dbMovies, ...apiMovies];

            if (combinedMovies.length > 0) {
                currentMovies = combinedMovies;
                displayMovies(combinedMovies);
                moviesGrid.style.display = 'grid';
            } else {
                noMovies.style.display = 'block';
                moviesGrid.style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading movies:', error);
            loading.style.display = 'none';
            noMovies.style.display = 'block';
        }
    }

    // 6. Example Firestore Queries
    async function fetchFirestoreMovies(mood) {
        try {
            const movieRef = collection(db, "movies");
            const q = query(movieRef, where("mood", "==", mood.toLowerCase()));
            const snapshot = await getDocs(q);
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                isFirestore: true, // Marker for Firestore movies
                ...doc.data()
            }));
        } catch (err) {
            console.error("Firestore fetch error:", err);
            return [];
        }
    }
    
    function loadRandomMoodMovies() {
        const randomMoods = ['happy', 'romantic', 'action', 'motivational'];
        const randomMood = randomMoods[Math.floor(Math.random() * randomMoods.length)];
        selectMood(randomMood);
    }
    
    function displayMovies(movies) {
        moviesGrid.innerHTML = '';
        
        movies.forEach(movie => {
            const movieCard = createMovieCard(movie);
            moviesGrid.appendChild(movieCard);
        });
    }
    
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.style.setProperty('--mood-color', movie.mood_color || '#6366f1');
    
    // Convert hex color to RGB for glow effect
    const rgb = hexToRgb(movie.mood_color || '#6366f1');
    if (rgb) {
        card.style.setProperty('--mood-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }
    
    // Poster Section
    const poster = document.createElement('div');
    poster.className = 'movie-poster';
    
    // Handle both TMDB (poster_url) and Firestore (thumbnail)
    const imgUrl = movie.thumbnail || movie.poster_url;
    const movieName = movie.movieName || movie.title;
    
    if (imgUrl) {
        const img = document.createElement('img');
        img.src = imgUrl;
        img.alt = movieName;
        img.loading = 'lazy';
        
        // Add error handler for broken images
        img.onerror = function() {
            const parent = this.parentElement;
            if (parent) {
                parent.innerHTML = '';
                const noPoster = document.createElement('div');
                noPoster.className = 'no-poster';
                noPoster.innerHTML = `
                    <div class="no-poster-content">
                        <i class="fas fa-film"></i>
                        <span class="no-poster-text">${movieName}</span>
                    </div>
                `;
                parent.appendChild(noPoster);
            }
        };
        
        poster.appendChild(img);
    } else {
        const noPoster = document.createElement('div');
        noPoster.className = 'no-poster';
        noPoster.innerHTML = `<i class="fas fa-film"></i>`;
        poster.appendChild(noPoster);
    }
    
    // Info Section
    const info = document.createElement('div');
    info.className = 'movie-info';
    
    const genre = document.createElement('div');
    genre.className = 'movie-genre';
    genre.textContent = (Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre) || 'Film';
    
    const title = document.createElement('h3');
    title.className = 'movie-title';
    title.textContent = movieName;
    
    const meta = document.createElement('div');
    meta.className = 'movie-meta';
    meta.innerHTML = `
        <span class="movie-year">${movie.year || 'N/A'}</span>
        <span class="movie-rating">
            <i class="fas fa-star" style="color: #facc15;"></i> ${movie.rating || 'N/A'}
        </span>
    `;
    
    const description = document.createElement('p');
    description.className = 'movie-description';
    const rawDesc = movie.oneLineTag || movie.description || 'No description available.';
    description.textContent = rawDesc.substring(0, 120) + '...';
    
    // Append in professional order
    info.appendChild(genre);
    info.appendChild(title);
    info.appendChild(meta);
    info.appendChild(description);
    
    card.appendChild(poster);
    card.appendChild(info);
    
    // Add click event to show details
    card.addEventListener('click', function() {
        showMovieDetails(movie);
    });
    
    return card;
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
    
// Update the showMovieDetails function
function showMovieDetails(movie) {
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div class="spinner"></div>
            <p>Loading movie details...</p>
        </div>
    `;
    
    movieModal.style.display = 'block';
    
    // 7. Handle Firestore movies in modal
    if (movie.isFirestore) {
        // For Firestore movies, we already have all details in the movie object
        displayEnhancedMovieDetails(movie, movie);
        return;
    }
    
    // Get detailed movie info for TMDB movies
    fetch(`/get_movie_details/${movie.id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayEnhancedMovieDetails(data.details, movie);
            } else {
                displayMovieDetails(movie, movie);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            displayMovieDetails(movie, movie);
        });
}

// New function for enhanced details
function displayEnhancedMovieDetails(details, originalMovie) {
    const modalBody = document.getElementById('modalBody');
    
    const runtime = (details.duration || details.runtime) ? `${details.duration || details.runtime + ' min'}` : 'Not specified';
    const taglineText = details.oneLineTag || details.tagline;
    const tagline = taglineText ? `<p class="tagline" style="font-style: italic; color: #ffa726; margin: 10px 0;">"${taglineText}"</p>` : '';
    
    // Handle Firestore vs TMDB property names
    const title = details.movieName || details.title || originalMovie.movieName || originalMovie.title;
    const rating = details.rating || originalMovie.rating;
    const year = details.year || originalMovie.year || (details.release_date ? details.release_date.substring(0,4) : 'N/A');
    const posterUrl = details.thumbnail || details.poster_url || originalMovie.thumbnail || originalMovie.poster_url;
    const overview = details.overview || originalMovie.overview || originalMovie.description;
    const trailerLink = ensureEmbedUrl(details.trailerLink || (details.trailer ? `https://www.youtube.com/embed/${details.trailer.key}` : null));
    
    // Streaming providers HTML
    const providers = details.platforms || details.streaming || [];
    let streamingHTML = '';
    if (providers && providers.length > 0) {
        streamingHTML = `
            <div class="modal-streaming">
                <h3><i class="fas fa-tv"></i> Available On</h3>
                <div class="provider-list">
                    ${providers.map(provider => `
                        <div class="provider-badge">
                            <i class="fas fa-play-circle"></i> ${provider}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Trailer HTML
    let trailerHTML = '';
    if (trailerLink) {
        trailerHTML = `
            <div class="trailer-section">
                <h3><i class="fas fa-film"></i> Watch Trailer</h3>
                <div class="trailer-container">
                    <iframe 
                        src="${trailerLink}" 
                        title="Movie Trailer"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen>
                    </iframe>
                </div>
            </div>
        `;
    } else {
        trailerHTML = `
            <div class="trailer-section">
                <h3><i class="fas fa-film"></i> Trailer</h3>
                <div class="no-trailer">
                    <i class="fas fa-video-slash fa-2x"></i>
                    <p>No trailer available</p>
                </div>
            </div>
        `;
    }
    
    // Cast HTML
    const cast = details.starring || details.cast || [];
    let castHTML = '';
    if (cast && cast.length > 0) {
        castHTML = `
            <div class="cast-section">
                <h3><i class="fas fa-users"></i> Starring</h3>
                <div class="cast-list">
                    ${cast.map(actor => `
                        <div class="cast-member">${actor}</div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    modalBody.innerHTML = `
        <div class="movie-details">
            <div class="details-header">
                <h2>${title}</h2>
                <div class="movie-stats">
                    <div class="stat-item">
                        <div class="stat-value">${rating}</div>
                        <div class="stat-label">Rating</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${year}</div>
                        <div class="stat-label">Year</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${runtime}</div>
                        <div class="stat-label">Duration</div>
                    </div>
                </div>
                ${tagline}
            </div>
            
            <div class="details-content">
                <div class="details-poster">
                    ${posterUrl ? 
                        `<img src="${posterUrl}" alt="${title}">` : 
                        `<div class="no-poster-large"><i class="fas fa-film fa-5x"></i></div>`
                    }
                </div>
                
                <div class="details-info">
                    <div class="genres">
                        ${(Array.isArray(details.genre) ? details.genre : (details.genre ? details.genre.split(', ') : [])).map(genre => 
                            `<span class="genre-tag">${genre}</span>`
                        ).join('')}
                    </div>
                    
                    ${streamingHTML}
                    
                    <h3>Overview</h3>
                    <p class="overview">${overview}</p>
                    
                    ${details.director ? `
                        <div class="director-section">
                            <h4><i class="fas fa-user-tie"></i> Director</h4>
                            <p>${details.director}</p>
                        </div>
                    ` : ''}
                    
                    ${castHTML}
                    
                    ${trailerHTML}
                    
                    <div class="mood-match">
                        <h3><i class="fas fa-heart"></i> Why this matches your mood</h3>
                        <p>${details.whyThisMatchesMood || `This movie is perfect for your <strong>${getMoodName(currentMood)}</strong> mood. The genre and tone align with what you're feeling right now!`}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}
    
    function displayMovieDetails(details, originalMovie) {
        const modalBody = document.getElementById('modalBody');
        
        const genres = details.genres || originalMovie.genre || ['Not specified'];
        const runtime = details.runtime ? `${details.runtime} min` : 'Not specified';
        const tagline = details.tagline ? `<p class="tagline">"${details.tagline}"</p>` : '';
        
        modalBody.innerHTML = `
            <div class="movie-details">
                <div class="details-header">
                    <h2>${details.title || originalMovie.title}</h2>
                    <div class="details-meta">
                        <span class="year">${details.release_date ? details.release_date.substring(0,4) : originalMovie.year}</span>
                        <span class="rating"><i class="fas fa-star"></i> ${details.rating || originalMovie.rating}</span>
                        <span class="runtime"><i class="fas fa-clock"></i> ${runtime}</span>
                    </div>
                    ${tagline}
                </div>
                
                <div class="details-content">
                    <div class="details-poster">
                        ${details.poster_url ? 
                            `<img src="${details.poster_url}" alt="${details.title}">` : 
                            `<div class="no-poster-large"><i class="fas fa-film fa-5x"></i></div>`
                        }
                    </div>
                    
                    <div class="details-info">
                        <div class="genres">
                            ${genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('')}
                        </div>
                        
                        <h3>Overview</h3>
                        <p class="overview">${details.overview || originalMovie.description}</p>
                        
                        <div class="mood-match">
                            <h3><i class="fas fa-heart"></i> Why this matches your mood</h3>
                            <p>This movie is perfect for your <strong>${getMoodName(currentMood)}</strong> mood because it has elements that align with what you're feeling right now.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Helper functions
    function getMoodName(moodId) {
        const moodNames = {
            'happy': 'Happy',
            'sad': 'Sad',
            'romantic': 'Romantic',
            'action': 'Action',
            'motivational': 'Motivational',
            'thriller': 'Thriller',
            'horror': 'Horror',
            'calm': 'Calm'
        };
        return moodNames[moodId] || moodId;
    }
    
    function getMoodEmoji(moodId) {
        const moodEmojis = {
            'happy': '😊',
            'sad': '😢',
            'romantic': '💖',
            'action': '⚔️',
            'motivational': '🔥',
            'thriller': '🎭',
            'horror': '👻',
            'calm': '😌'
        };
        return moodEmojis[moodId] || '🎬';
    }

    // Helper for YouTube embed link conversion
    function ensureEmbedUrl(url) {
        if (!url) return null;
        if (url.includes('youtube.com/embed/')) return url;
        
        let videoId = '';
        try {
            if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1].split(/[?#]/)[0];
            } else if (url.includes('youtube.com/watch')) {
                const urlObj = new URL(url);
                videoId = urlObj.searchParams.get('v');
            } else if (url.includes('youtube.com/v/')) {
                videoId = url.split('youtube.com/v/')[1].split(/[?#]/)[0];
            }
        } catch (e) {
            console.error('Error parsing YouTube URL:', e);
            return url;
        }
        
        return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
});