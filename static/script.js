import { db, collection, getDocs, query, where } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log("Filmtales UI Loaded. Context:", window.FILMTALES_CONTEXT);

    const moviesGrid = document.getElementById('moviesGrid');
    const loading = document.getElementById('loading');
    const noMovies = document.getElementById('noMovies');
    const refreshBtn = document.getElementById('refreshBtn');
    
    // Global Modal elements
    const movieModal = document.getElementById('movieModal');
    const modalBody = document.getElementById('modalBody');
    const closeBtn = document.querySelector('.close-btn');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            movieModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === movieModal) {
            movieModal.style.display = 'none';
        }
    });

    // ---------------------------------------------------------------- //
    // Context Branching logic
    // ---------------------------------------------------------------- //

    if (window.FILMTALES_CONTEXT === 'landing') {
        const previewMovies = window.PREVIEW_MOVIES_DATA || [];
        if (previewMovies.length > 0) {
            const previewContainer = document.getElementById('moviePreviewContainer');
            if (previewContainer) previewContainer.style.display = 'block';
            displayMovies(previewMovies, moviesGrid);
        }
    } 
    else if (window.FILMTALES_CONTEXT === 'results') {
        const activeMood = window.ACTIVE_MOOD_ID;
        if (activeMood) {
            loadMovies(activeMood.toLowerCase());
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => loadMovies(activeMood.toLowerCase()));
            }
        }
    }

    // ---------------------------------------------------------------- //
    // Data Fetching 
    // ---------------------------------------------------------------- //

    async function loadMovies(mood) {
        if (loading) loading.style.display = 'block';
        if (moviesGrid) moviesGrid.style.display = 'none';
        if (noMovies) noMovies.style.display = 'none';
        
        try {
            // Fetch from API
            const apiRequest = fetch('/get_recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mood: mood })
            }).then(r => r.json());

            // Fetch from Firestore
            const dbRequest = fetchFirestoreMovies(mood);

            const [apiData, dbMovies] = await Promise.all([apiRequest, dbRequest]);

            if (loading) loading.style.display = 'none';

            let apiMovies = (apiData.success && apiData.movies) ? apiData.movies : [];
            const combinedMovies = [...dbMovies, ...apiMovies];

            if (combinedMovies.length > 0) {
                displayMovies(combinedMovies, moviesGrid);
                if (moviesGrid) moviesGrid.style.display = 'grid';
            } else {
                if (noMovies) noMovies.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading movies:', error);
            if (loading) loading.style.display = 'none';
            if (noMovies) noMovies.style.display = 'block';
        }
    }

    async function fetchFirestoreMovies(mood) {
        try {
            const movieRef = collection(db, "movies");
            const q = query(movieRef, where("mood", "==", mood));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                isFirestore: true,
                ...doc.data()
            }));
        } catch (err) {
            console.error("Firestore fetch error:", err);
            return [];
        }
    }

    // ---------------------------------------------------------------- //
    // DOM Rendering 
    // ---------------------------------------------------------------- //

    function displayMovies(movies, container) {
        if (!container) return;
        container.innerHTML = '';
        movies.forEach(movie => {
            container.appendChild(createMovieCard(movie));
        });
    }

    function createMovieCard(movie) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        
        const poster = document.createElement('div');
        poster.className = 'movie-poster';
        
        // Resolve Image Path through anti-timeout image proxy
        let imgUrl = movie.thumbnail || movie.poster_url;
        if (!imgUrl && movie.poster_path) {
            imgUrl = `https://wsrv.nl/?url=image.tmdb.org/t/p/w500${movie.poster_path}&w=500`;
        }
        
        const movieName = movie.movieName || movie.title;
        
        if (imgUrl) {
            const img = document.createElement('img');
            img.src = imgUrl;
            img.alt = movieName;
            img.loading = 'lazy';
            img.onerror = function() {
                this.parentElement.innerHTML = '<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:var(--bg-secondary);"><i class="fas fa-film fa-3x" style="opacity:0.2; color:var(--active-mood);"></i></div>';
            };
            poster.appendChild(img);
        } else {
            poster.innerHTML = '<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:var(--bg-secondary);"><i class="fas fa-film fa-3x" style="opacity:0.2; color:var(--active-mood);"></i></div>';
        }
        
        // Info Section
        const info = document.createElement('div');
        info.className = 'movie-info';
        
        const title = document.createElement('h3');
        title.className = 'movie-title';
        title.textContent = movieName;
        
        const meta = document.createElement('div');
        meta.className = 'movie-meta';
        meta.innerHTML = `
            <span class="movie-rating"><i class="fas fa-star"></i> ${parseFloat(movie.rating || movie.vote_average || 0).toFixed(1)}</span>
            <span class="movie-year">${(movie.year || movie.release_date || '').toString().substring(0,4)}</span>
        `;
        
        const playBtn = document.createElement('div');
        playBtn.className = 'play-btn-overlay';
        playBtn.innerHTML = `<i class="fas fa-play"></i> View Details`;
        
        info.appendChild(title);
        info.appendChild(meta);
        info.appendChild(playBtn);
        
        card.appendChild(poster);
        card.appendChild(info);
        
        card.addEventListener('click', () => {
            if (movie.isFirestore || movie.isFallback) {
                displayEnhancedMovieDetails(movie, movie.mood || window.ACTIVE_MOOD_ID || 'happy');
            } else {
                fetchMovieDetailsFromAPI(movie.id, window.ACTIVE_MOOD_ID || 'happy');
            }
        });
        
        return card;
    }

    async function fetchMovieDetailsFromAPI(movieId, mood) {
        try {
            const response = await fetch(`/get_movie_details/${movieId}`);
            const data = await response.json();
            
            if (data.success) {
                displayEnhancedMovieDetails(data.details, mood);
            } else {
                alert('Could not fetch specific movie details.');
            }
        } catch (error) {
            console.error('Error fetching details:', error);
        }
    }

    function displayEnhancedMovieDetails(details, mood) {
        if (!modalBody) return;

        const title = details.movieName || details.title;
        let posterUrl = details.thumbnail || details.poster_url;
        if (!posterUrl && details.poster_path) {
            posterUrl = `https://wsrv.nl/?url=image.tmdb.org/t/p/w500${details.poster_path}&w=500`;
        }

        const rating = parseFloat(details.rating || details.vote_average || 0).toFixed(1);
        const year = (details.year || details.release_date || '').toString().substring(0, 4);
        const duration = details.duration || (details.runtime ? `${details.runtime} min` : 'N/A');
        
        let genreList = '';
        if (Array.isArray(details.genres)) {
            genreList = details.genres.map(g => `<span class="pill-tag">${g.name || g}</span>`).join('');
        } else if (Array.isArray(details.genre)) {
            genreList = details.genre.map(g => `<span class="pill-tag">${g}</span>`).join('');
        } else if (typeof details.genre === 'string') {
            genreList = `<span class="pill-tag">${details.genre}</span>`;
        }

        const fallbackImg = `<div style="width:100%; height:450px; display:flex; align-items:center; justify-content:center; background:#111827; border-radius:16px;"><i class="fas fa-film fa-4x" style="opacity:0.2;"></i></div>`;

        let streamingHtml = '';
        if (Array.isArray(details.streaming) && details.streaming.length > 0) {
            streamingHtml = `<div class="info-group">
                <h4><i class="fas fa-tv" style="color:var(--active-mood);"></i> Available On</h4>
                <div class="pill-container">${details.streaming.map(p => `<span class="pill-tag platform-tag">${p}</span>`).join('')}</div>
            </div>`;
        }

        let directorHtml = '';
        if (details.director) {
            directorHtml = `<div class="info-group">
                <h4><i class="fas fa-user-tie" style="color:var(--active-mood);"></i> Director</h4>
                <div class="pill-container"><span class="pill-tag">${details.director}</span></div>
            </div>`;
        }

        let castHtml = '';
        if (Array.isArray(details.cast) && details.cast.length > 0) {
            castHtml = `<div class="info-group">
                <h4><i class="fas fa-users" style="color:var(--active-mood);"></i> Starring</h4>
                <div class="pill-container">${details.cast.slice(0, 6).map(c => `<span class="pill-tag">${c}</span>`).join('')}</div>
            </div>`;
        }

        let trailerId = '';
        if (details.trailerLink) {
            if (details.trailerLink.includes('v=')) trailerId = details.trailerLink.split('v=')[1].split('&')[0];
            else if (details.trailerLink.includes('youtu.be/')) trailerId = details.trailerLink.split('youtu.be/')[1].split('?')[0];
        } else if (details.trailer_url) {
            if (details.trailer_url.includes('v=')) trailerId = details.trailer_url.split('v=')[1].split('&')[0];
            else if (details.trailer_url.includes('youtu.be/')) trailerId = details.trailer_url.split('youtu.be/')[1].split('?')[0];
        } else if (details.trailer && details.trailer.key) {
            trailerId = details.trailer.key;
        }

        let trailerHtml = '';
        if (trailerId) {
            trailerHtml = `
                <div class="trailer-side">
                    <h4><i class="fab fa-youtube" style="color:var(--active-mood);"></i> Watch Trailer</h4>
                    <div class="trailer-container-ref">
                        <iframe src="https://www.youtube.com/embed/${trailerId}?autoplay=0" allowfullscreen></iframe>
                    </div>
                </div>
            `;
        }

        let moodHtml = '';
        const currentMoodName = window.ACTIVE_MOOD_ID || mood || 'Happy';
        const formattedMood = currentMoodName.charAt(0).toUpperCase() + currentMoodName.slice(1);

        moodHtml = `
            <div class="mood-side">
                <div class="mood-box-ref">
                    <h4><i class="fas fa-heart" style="color:var(--active-mood);"></i> Why this matches your mood</h4>
                    <p>${details.whyThisMatchesMood || `This movie is perfect for your <strong>${formattedMood}</strong> mood. The genre and tone align with what you're feeling right now!`}</p>
                </div>
            </div>
        `;

        let html = `
            <div class="enhanced-modal-content">
                <div class="modal-header-section">
                    <h2 class="modal-title-ref">${title}</h2>
                    <div class="modal-stats-ref">
                        <div class="stat-box">
                            <span class="stat-value">${rating}</span>
                            <span class="stat-label">RATING</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-value">${year}</span>
                            <span class="stat-label">YEAR</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-value">${duration}</span>
                            <span class="stat-label">DURATION</span>
                        </div>
                    </div>
                    ${details.tagline ? `<p class="modal-tagline-ref">"${details.tagline}"</p>` : ''}
                </div>

                <div class="modal-main-grid">
                    <div class="modal-left-col">
                        <div class="modal-poster-ref">
                            ${posterUrl ? `<img src="${posterUrl}" alt="${title}" onerror="this.style.display='none'; this.parentElement.querySelector('.poster-fallback').style.display='flex';">` : ''}
                            <div class="poster-fallback" style="display: ${posterUrl ? 'none' : 'flex'}; width:100%; height:450px; align-items:center; justify-content:center; background:#111827; border-radius:16px;">
                                <i class="fas fa-film fa-4x" style="opacity:0.2;"></i>
                            </div>
                        </div>
                        <div class="modal-genres-ref">
                            ${genreList}
                        </div>
                    </div>
                    
                    <div class="modal-right-col">
                        ${streamingHtml}
                        
                        <div class="info-group">
                            <h4>Overview</h4>
                            <p class="overview-text-ref">${details.overview || 'No overview available.'}</p>
                        </div>
                        
                        ${directorHtml}
                        ${castHtml}
                    </div>
                </div>

                <div class="modal-footer-grid">
                    ${trailerHtml}
                    ${moodHtml}
                </div>
            </div>
        `;

        modalBody.innerHTML = html;
        movieModal.style.display = 'block';
    }
});