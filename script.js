document.addEventListener('DOMContentLoaded', function() {

    // Lykkehjul med pop-up (Modal)
    const wheel = document.getElementById('wheel');
    const spinBtn = document.getElementById('spinBtn');
    const clapper = document.querySelector('.clapper');

    const tickSound = new Audio('Sound/tick.mp3'); // lyd til hjulet

    const modal = document.getElementById('prizeModal');
    const prizeImg = document.getElementById('prizeImage');
    const countdownEl = document.getElementById('countdown');
    const closeModalBtn = document.getElementById('closeModal');

    // Præmier i samme rækkefølge som felterne på hjulet
    const prizes = [
        'Images/Ingen.png',   // 0
        'Images/Klister.png', // 1
        'Images/Ingen.png',   // 2
        'Images/Rabat.png',   // 3
        'Images/Ingen.png',   // 4
        'Images/Ring.png',    // 5
        'Images/Slik.png',    // 6
        'Images/Rabat.png'    // 7
    ];

    const indexOffset = 0; // Kan justeres, hvis grafik og array ikke matcher

    let currentRotation = 0;
    let countdownInterval;

    // Luk modal og stop lyd
    if (closeModalBtn && modal) {
        closeModalBtn.addEventListener('click', function () {
            modal.style.display = 'none';
            tickSound.pause();
            tickSound.currentTime = 0;
        });
    }

    // Normaliser vinkel til 0–359
    function normalizeAngle(angle) {
        let a = angle % 360;
        if (a < 0) a += 360;
        return a;
    }

    // Find feltet under pilen ud fra rotation
    function getWinningIndex(rotationDeg) {
        const segmentSize = 360 / prizes.length; // 45 grader
        const pointerAngle = 270;                // pil i toppen (12:00)
        const r = normalizeAngle(rotationDeg);
        const angleAtPointer = normalizeAngle(pointerAngle - r);
        let rawIndex = Math.floor(angleAtPointer / segmentSize);
        return (rawIndex + indexOffset + prizes.length) % prizes.length;
    }

    // Klik på SPIN-knappen
    if (spinBtn && wheel) {
        spinBtn.addEventListener('click', function () {
            const lastSpin = localStorage.getItem('lastSpinTime');
            const now = new Date().getTime();
            const cooldownTime = 24 * 60 * 60 * 1000; // 24 timer

            // Vis “prøv igen senere”- pop-up hvis der er cooldown
            if (lastSpin && (now - lastSpin < cooldownTime)) {
                showPopup('Images/Hjulpopup.png', true);
                return;
            }

            // Start spin og sæt ny tid
            spinBtn.disabled = true;
            localStorage.setItem('lastSpinTime', now);

            // Spil lyd til hjulet
            tickSound.currentTime = 0;
            tickSound.play().catch(e => console.log("Lydfejl:", e));

            const spinDuration = 15; // Hjulet spinner ca. 15 sekunder
            wheel.style.transition =
                `transform ${spinDuration}s cubic-bezier(0.1, 0.7, 0.1, 1)`;

            const baseSpins = 360 * 5; // mindst 5 omgange
            const randomAngle = Math.floor(Math.random() * 360);
            const totalDeg = baseSpins + randomAngle;

            currentRotation += totalDeg;
            wheel.style.transform = `rotate(${currentRotation}deg)`;

            if (clapper) clapper.classList.add('animating');

            // Når hjulet er færdigt med at dreje
            setTimeout(() => {
                if (clapper) clapper.classList.remove('animating');
                spinBtn.disabled = false;

                const winningIndex = getWinningIndex(currentRotation);

                // Vent ét sekund og vis præmien
                setTimeout(() => {
                    showPopup(prizes[winningIndex], false);
                }, 1000);

            }, spinDuration * 1000);
        });
    }

    // Vis popup med præmie eller cooldown
    function showPopup(imagePath, isCooldown) {
        if (prizeImg) prizeImg.src = imagePath;
        if (modal) {
            modal.style.display = 'flex';
            if (isCooldown) {
                modal.classList.add('cooldown-active');
            } else {
                modal.classList.remove('cooldown-active');
            }
        }
        startRealtimeTimer();
    }

    // Start nedtælling i popup
    function startRealtimeTimer() {
        if (countdownInterval) clearInterval(countdownInterval);
        updateTimer();
        countdownInterval = setInterval(updateTimer, 1000);
    }

    // Opdater nedtælling til næste spin
    function updateTimer() {
        if (!countdownEl) return;

        const lastSpin = localStorage.getItem('lastSpinTime');
        if (!lastSpin) {
            countdownEl.textContent = "";
            return;
        }

        const now = new Date().getTime();
        const targetTime = parseInt(lastSpin) + (24 * 60 * 60 * 1000);
        const distance = targetTime - now;

        if (distance < 0) {
            clearInterval(countdownInterval);
            countdownEl.textContent = "KLAR TIL SPIN!";
        } else {
            const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((distance % (1000 * 60)) / 1000);

            const hStr = h < 10 ? "0" + h : h;
            const mStr = m < 10 ? "0" + m : m;
            const sStr = s < 10 ? "0" + s : s;

            countdownEl.textContent = hStr + ":" + mStr + ":" + sStr;
        }
    }

    // Bog: klik for at bladre med lyd
    const bookFrame = document.getElementById('interactive-book');
    const bookStates = document.querySelectorAll('.book-state');
    const pageSound = new Audio('Sound/skritch.mp3');
    let currentBookState = 0;

    if (bookFrame && bookStates.length > 0) {
        bookFrame.addEventListener('click', function () {
            try {
                pageSound.currentTime = 0;
                pageSound.play().catch(() => {});
            } catch (err) {}

            bookStates[currentBookState].classList.remove('active');
            currentBookState++;

            if (currentBookState >= bookStates.length) {
                currentBookState = 0;
            }

            bookStates[currentBookState].classList.add('active');
        });
    }

    // Kostumekonkurrence: billedekarrusel
    const track = document.querySelector('.carousel-track');
    if (track) {
        const slides = Array.from(track.children);
        const nextButton = document.querySelector('.carousel-button--right');
        const prevButton = document.querySelector('.carousel-button--left');
        const dotsNav = document.querySelector('.carousel-nav');
        const dots = Array.from(dotsNav.children);

        function moveToSlide(currentSlide, targetSlide) {
            const targetIndex = slides.findIndex(slide => slide === targetSlide);
            track.style.transform = 'translateX(-' + (targetIndex * 100) + '%)';
            currentSlide.classList.remove('current-slide');
            targetSlide.classList.add('current-slide');
        }

        function updateDots(currentDot, targetDot) {
            currentDot.classList.remove('current-slide');
            targetDot.classList.add('current-slide');
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                const currentSlide = track.querySelector('.current-slide');
                let nextSlide = currentSlide.nextElementSibling;
                const currentDot = dotsNav.querySelector('.current-slide');
                let nextDot = currentDot.nextElementSibling;

                if (!nextSlide) {
                    nextSlide = slides[0];
                    nextDot = dots[0];
                }

                moveToSlide(currentSlide, nextSlide);
                updateDots(currentDot, nextDot);
            });
        }

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                const currentSlide = track.querySelector('.current-slide');
                let prevSlide = currentSlide.previousElementSibling;
                const currentDot = dotsNav.querySelector('.current-slide');
                let prevDot = currentDot.previousElementSibling;

                if (!prevSlide) {
                    prevSlide = slides[slides.length - 1];
                    prevDot = dots[dots.length - 1];
                }

                moveToSlide(currentSlide, prevSlide);
                updateDots(currentDot, prevDot);
            });
        }

        if (dotsNav) {
            dotsNav.addEventListener('click', e => {
                const targetDot = e.target.closest('button');
                if (!targetDot) return;

                const currentSlide = track.querySelector('.current-slide');
                const currentDot = dotsNav.querySelector('.current-slide');
                const targetIndex = dots.findIndex(dot => dot === targetDot);
                const targetSlide = slides[targetIndex];

                moveToSlide(currentSlide, targetSlide);
                updateDots(currentDot, targetDot);
            });
        }
    }

    // Spooky Movie Nights: Swiper slider
    if (typeof Swiper !== 'undefined' && document.querySelector('.movieSwiper')) {
        new Swiper('.movieSwiper', {
            effect: 'coverflow',
            grabCursor: true,
            centeredSlides: true,
            slidesPerView: 'auto',
            initialSlide: 1,
            loop: true,
            coverflowEffect: {
                rotate: 20,
                stretch: 0,
                depth: 200,
                modifier: 1,
                slideShadows: true,
            }
            // autoplay kan evt. tændes senere
        });
    }

});