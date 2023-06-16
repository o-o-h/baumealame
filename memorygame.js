var GAME8 = GAME8 || {};

GAME8.Game = (function() {

    var activeCards = [];
    var numOfCards;
    var cardHitCounter = 0;
    var card;
    var timer;
    var storage;

    /**
     * Method that will be invoked on card click
     */
    function handleCardClick() {

        var connection = $(this).data('connection');
        var hit;

        // Set card in active state
        // 'this' needs to be attached to context of card which is clicked
        if ( !$(this).hasClass('active') ) {
            $(this).addClass('active');
            activeCards.push($(this));

            // If user click on two cards then check
            if (activeCards.length == 2) {
                hit = checkActiveCards(activeCards);
            }

            if (hit === true) {
                cardHitCounter++;
                activeCards[0].add(activeCards[1]).unbind().addClass('wobble cursor-default');
                activeCards = [];

                // Game End
                if(cardHitCounter === (numOfCards / 2)) {
                    // Reset active cards
                    activeCards = [];
                    // Reset counter
                    cardHitCounter = 0;
                    // End game
                    endGame();
                }
            }
            // In case when user open more then 2 cards then automatically close first two
            else if(activeCards.length === 3) {
                for(var i = 0; i < activeCards.length - 1; i++) {
                    activeCards[i].removeClass('active');
                }
                activeCards.splice(0, 2);
            }
        }
    }

    function endGame() {
        timer.stopTimer();

        // Retrieve current time
        var time = timer.retrieveTime();

        // Retrieve time from storage
        var timeFromStorage = storage.retrieveBestTime();

        // if there's already time saved in storage check if it's better than current one
        if (timeFromStorage != undefined && timeFromStorage != '') {
            // if current game time is better than one saved in store then save new one
            if (time.minutes < timeFromStorage.minutes || (time.minutes == timeFromStorage.minutes && time.seconds < timeFromStorage.seconds) ) {
                storage.setBestTime(time);
            }
        }
        // else if time is not saved in storage save it
        else {
            storage.setBestTime(time);
        }

        // Update best time
        timer.updateBestTime();
    }

    function checkActiveCards(connections) {
        return connections[0].data('connection') === connections[1].data('connection');
    }

    return function(config) {

        /**
         * Main method for game initialization
         */
        this.startGame = function() {
            card = new GAME8.Card();
            timer = new GAME8.Timer();
            storage = new GAME8.Storage();
            numOfCards = config.cards.length;
            card.attachCardEvent(handleCardClick, config);
        };

        /**
         * After game initialization call this method in order to generate cards
         */
        this.generateCardSet = function() {
            // Generate new card set
            card.generateCards(config.cards);
            // Reset active cards array
            activeCards = [];

            // Reset timer
            timer.stopTimer();
            // Set timer
            timer.startTimer();
        };

        this.startGame();
    }

})();



GAME8.Card = (function () {

    // Private variables
    var $cardsContainer = $('#cards-container-game8');
    var $cardTemplate = $('#card-template-game8');

    /**
     * Private method
     * Take card template from DOM and update it with card data
     * @param {Object} card - card object
     * @return {Object} template - jquery object
     */
    function prepareCardTemplate (card) {
        var template = $cardTemplate
                            .clone()
                            .removeAttr('id')
                            .removeClass('hide')
                            .attr('data-connection', card.connectionID);

        // If card has background image
        if (card.backImg != '' ) {
            template.find('.back').css({
                'background': 'url(' + card.backImg + ') no-repeat center center',
                'background-size': 'cover'
            });
        }
        // Else if card has no background image but has text
        if (card.backTxt != '') {
            template.find('.back > label').html(card.backTxt);
        }

        return template;
    }

    /**
     * Private method
     * Method for random shuffling array
     * @param {Object} cardsArray - array of card objects
     * @return {Object} returns random shuffled array
     */
    function shuffleCards(cardsArray) {
        var currentIndex = cardsArray.length, temporaryValue, randomIndex;

        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = cardsArray[currentIndex];
            cardsArray[currentIndex] = cardsArray[randomIndex];
            cardsArray[randomIndex] = temporaryValue;
        }

        return cardsArray;
    }

    return function() {

        /**
         * Public method
         * Prepare all cards and insert them into DOM
         * Before inserting new set of cards method will erase all previous cards
         * @param {Object} cards - array of card objects
         */
        this.generateCards = function(cards) {
            var templates = [];
            var preparedTemplate;

            // Prepare every card and push it to array
            cards.forEach(function (card) {
                preparedTemplate = prepareCardTemplate(card);
                templates.push(preparedTemplate);
            });

            // Shuffle card array
            templates = shuffleCards(templates);

            // Hide and empty card container
            $cardsContainer.hide().empty();

            // Append all cards to cards container
            templates.forEach(function(card) {
                $cardsContainer.append(card);
            });

            // Show card container
            $cardsContainer.fadeIn('slow');
        };

        /**
         * Public method
         * Attach click event on every card
         * Before inserting new set of cards method will erase all previous cards
         * @param {Function} func - function that will be invoked on card click
         */
        this.attachCardEvent = function(func) {
            $cardsContainer.unbind().on('click', '.flip-container', function() {
                func.call(this);
            });
        }
    }

})();

GAME8.Timer = (function() {

    var $timer = $('.timer');
    var $seconds = $timer.find('#seconds');
    var $minutes = $timer.find('#minutes');
    var $bestTimeContainer = $timer.find('.time');


    var minutes, seconds;

    function decorateNumber(value) {
        return value > 9 ? value : '0' + value;
    }

    return function() {
        var interval;
        var storage = new GAME8.Storage();

        this.startTimer = function() {
            var sec = 0;
            var bestTime;

            // Set timer interval
            interval = setInterval( function() {
                seconds = ++sec % 60;
                minutes = parseInt(sec / 60, 10);
                $seconds.html(decorateNumber(seconds));
                $minutes.html(decorateNumber(minutes));
            }, 1000);

            // Show timer
            $timer.delay(1000).fadeIn();

            this.updateBestTime();
        };

        this.updateBestTime = function() {
            // Check if user have saved best game time
            bestTime = storage.retrieveBestTime();
            if(bestTime != undefined && bestTime != '') {
                $bestTimeContainer
                    .find('#bestTime')
                    .text(bestTime.minutes + ':' + bestTime.seconds)
                    .end()
                    .fadeIn();
            }
        };

        this.stopTimer = function() {
            clearInterval(interval);
        };

        this.retrieveTime = function() {
            return {
                minutes: decorateNumber(minutes),
                seconds: decorateNumber(seconds)
            }
        };
    }
})();


GAME8.Storage = (function() {

    return function() {

        /**
         * Save best time to localStorage
         * key = 'bestTime'
         * @param {Object} time - object with keys: 'minutes', 'seconds'
         */
        this.setBestTime = function(time) {
            localStorage.setItem('bestTime', JSON.stringify(time));
        };

        /**
         * Retrieve best time from localStorage
         */
        this.retrieveBestTime = function() {
            return JSON.parse(localStorage.getItem('bestTime'));
        };

    }
})();



// Game init
$(function() {

        var game8 = new GAME8.Game({
            cards: [
                {
                    backImg: './img/01_권기옥.png',
                    backTxt: '권기옥',
                    connectionID: 1
                },
                {
                    backImg: './img/01_권기옥.png',
                    backTxt: '권기옥',
                    connectionID: 1
                },
                {
                    backImg: './img/02_김명순.png',
                    backTxt: '김명순',
                    connectionID: 2
                },
                {
                    backImg: './img/02_김명순.png',
                    backTxt: '김명순',
                    connectionID: 2
                },
                {
                    backImg: './img/03_김점동.png',
                    backTxt: '김점동',
                    connectionID: 3
                },
                {
                    backImg: './img/03_김점동.png',
                    backTxt: '김점동',
                    connectionID: 3
                },

                {
                    backImg: './img/05_나혜석.png',
                    backTxt: '나혜석',
                    connectionID: 4
                },
                {
                    backImg: './img/05_나혜석.png',
                    backTxt: '나혜석',
                    connectionID: 4
                },

                {
                    backImg: './img/09_박남옥.png',
                    backTxt: '박남옥',
                    connectionID: 5
                },
                {
                    backImg: './img/09_박남옥.png',
                    backTxt: '박남옥',
                    connectionID: 5
                },
                {
                    backImg: './img/12_부춘화.png',
                    backTxt: '부춘화',
                    connectionID: 6
                },
                {
                    backImg: './img/12_부춘화.png',
                    backTxt: '부춘화',
                    connectionID: 6
                },
                {
                    backImg: './img/14_이태영.png',
                    backTxt: '이태영',
                    connectionID: 7
                },
                {
                    backImg: './img/14_이태영.png',
                    backTxt: '이태영',
                    connectionID: 7
                },
                {
                    backImg: './img/19_허정숙.png',
                    backTxt: '허정숙',
                    connectionID: 8
                },
                {
                    backImg: './img/19_허정숙.png',
                    backTxt: '허정숙',
                    connectionID: 8
                },
            ]
        });

        $('#btn-start-game8').click(function() {
            game8.generateCardSet();
            $('#btn-start-game8').addClass('hide');
            $('#btn-start-game12').addClass('hide');
            $('#btn-start-game20').addClass('hide');
            $('#btn-refresh').removeClass('hide');
            $('#level-game8').removeClass('hide');
            $('.wrapper_btn').addClass('hide');            
        });

    });




var GAME12 = GAME12 || {};

GAME12.Game = (function() {

    var activeCards = [];
    var numOfCards;
    var cardHitCounter = 0;
    var card;
    var timer;
    var storage;

    /**
     * Method that will be invoked on card click
     */
    function handleCardClick() {

        var connection = $(this).data('connection');
        var hit;

        // Set card in active state
        // 'this' needs to be attached to context of card which is clicked
        if ( !$(this).hasClass('active') ) {
            $(this).addClass('active');
            activeCards.push($(this));

            // If user click on two cards then check
            if (activeCards.length == 2) {
                hit = checkActiveCards(activeCards);
            }

            if (hit === true) {
                cardHitCounter++;
                activeCards[0].add(activeCards[1]).unbind().addClass('wobble cursor-default');
                activeCards = [];

                // Game End
                if(cardHitCounter === (numOfCards / 2)) {
                    // Reset active cards
                    activeCards = [];
                    // Reset counter
                    cardHitCounter = 0;
                    // End game
                    endGame();
                }
            }
            // In case when user open more then 2 cards then automatically close first two
            else if(activeCards.length === 3) {
                for(var i = 0; i < activeCards.length - 1; i++) {
                    activeCards[i].removeClass('active');
                }
                activeCards.splice(0, 2);
            }
        }
    }

    function endGame() {
        timer.stopTimer();

        // Retrieve current time
        var time = timer.retrieveTime();

        // Retrieve time from storage
        var timeFromStorage = storage.retrieveBestTime();

        // if there's already time saved in storage check if it's better than current one
        if (timeFromStorage != undefined && timeFromStorage != '') {
            // if current game time is better than one saved in store then save new one
            if (time.minutes < timeFromStorage.minutes || (time.minutes == timeFromStorage.minutes && time.seconds < timeFromStorage.seconds) ) {
                storage.setBestTime(time);
            }
        }
        // else if time is not saved in storage save it
        else {
            storage.setBestTime(time);
        }

        // Update best time
        timer.updateBestTime();
    }

    function checkActiveCards(connections) {
        return connections[0].data('connection') === connections[1].data('connection');
    }

    return function(config) {

        /**
         * Main method for game initialization
         */
        this.startGame = function() {
            card = new GAME12.Card();
            timer = new GAME12.Timer();
            storage = new GAME12.Storage();
            numOfCards = config.cards.length;
            card.attachCardEvent(handleCardClick, config);
        };

        /**
         * After game initialization call this method in order to generate cards
         */
        this.generateCardSet = function() {
            // Generate new card set
            card.generateCards(config.cards);
            // Reset active cards array
            activeCards = [];

            // Reset timer
            timer.stopTimer();
            // Set timer
            timer.startTimer();
        };

        this.startGame();
    }

})();



GAME12.Card = (function () {

    // Private variables
    var $cardsContainer = $('#cards-container-game12');
    var $cardTemplate = $('#card-template-game12');

    /**
     * Private method
     * Take card template from DOM and update it with card data
     * @param {Object} card - card object
     * @return {Object} template - jquery object
     */
    function prepareCardTemplate (card) {
        var template = $cardTemplate
                            .clone()
                            .removeAttr('id')
                            .removeClass('hide')
                            .attr('data-connection', card.connectionID);

        // If card has background image
        if (card.backImg != '' ) {
            template.find('.back').css({
                'background': 'url(' + card.backImg + ') no-repeat center center',
                'background-size': '120%'
            });
        }
        // Else if card has no background image but has text
        if (card.backTxt != '') {
            template.find('.back > label').html(card.backTxt);
        }

        return template;
    }

    /**
     * Private method
     * Method for random shuffling array
     * @param {Object} cardsArray - array of card objects
     * @return {Object} returns random shuffled array
     */
    function shuffleCards(cardsArray) {
        var currentIndex = cardsArray.length, temporaryValue, randomIndex;

        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = cardsArray[currentIndex];
            cardsArray[currentIndex] = cardsArray[randomIndex];
            cardsArray[randomIndex] = temporaryValue;
        }

        return cardsArray;
    }

    return function() {

        /**
         * Public method
         * Prepare all cards and insert them into DOM
         * Before inserting new set of cards method will erase all previous cards
         * @param {Object} cards - array of card objects
         */
        this.generateCards = function(cards) {
            var templates = [];
            var preparedTemplate;

            // Prepare every card and push it to array
            cards.forEach(function (card) {
                preparedTemplate = prepareCardTemplate(card);
                templates.push(preparedTemplate);
            });

            // Shuffle card array
            templates = shuffleCards(templates);

            // Hide and empty card container
            $cardsContainer.hide().empty();

            // Append all cards to cards container
            templates.forEach(function(card) {
                $cardsContainer.append(card);
            });

            // Show card container
            $cardsContainer.fadeIn('slow');
        };

        /**
         * Public method
         * Attach click event on every card
         * Before inserting new set of cards method will erase all previous cards
         * @param {Function} func - function that will be invoked on card click
         */
        this.attachCardEvent = function(func) {
            $cardsContainer.unbind().on('click', '.flip-container', function() {
                func.call(this);
            });
        }
    }

})();

GAME12.Timer = (function() {

    var $timer = $('.timer');
    var $seconds = $timer.find('#seconds');
    var $minutes = $timer.find('#minutes');
    var $bestTimeContainer = $timer.find('.time');


    var minutes, seconds;

    function decorateNumber(value) {
        return value > 9 ? value : '0' + value;
    }

    return function() {
        var interval;
        var storage = new GAME12.Storage();

        this.startTimer = function() {
            var sec = 0;
            var bestTime;

            // Set timer interval
            interval = setInterval( function() {
                seconds = ++sec % 60;
                minutes = parseInt(sec / 60, 10);
                $seconds.html(decorateNumber(seconds));
                $minutes.html(decorateNumber(minutes));
            }, 1000);

            // Show timer
            $timer.delay(1000).fadeIn();

            this.updateBestTime();
        };

        this.updateBestTime = function() {
            // Check if user have saved best game time
            bestTime = storage.retrieveBestTime();
            if(bestTime != undefined && bestTime != '') {
                $bestTimeContainer
                    .find('#bestTime')
                    .text(bestTime.minutes + ':' + bestTime.seconds)
                    .end()
                    .fadeIn();
            }
        };

        this.stopTimer = function() {
            clearInterval(interval);
        };

        this.retrieveTime = function() {
            return {
                minutes: decorateNumber(minutes),
                seconds: decorateNumber(seconds)
            }
        };
    }
})();


GAME12.Storage = (function() {

    return function() {

        /**
         * Save best time to localStorage
         * key = 'bestTime'
         * @param {Object} time - object with keys: 'minutes', 'seconds'
         */
        this.setBestTime = function(time) {
            localStorage.setItem('bestTime', JSON.stringify(time));
        };

        /**
         * Retrieve best time from localStorage
         */
        this.retrieveBestTime = function() {
            return JSON.parse(localStorage.getItem('bestTime'));
        };

    }
})();



// Game init
$(function() {

        var game12 = new GAME12.Game({
            cards: [
                {
                    backImg: './img/01_권기옥.png',
                    backTxt: '권기옥',
                    connectionID: 1
                },
                {
                    backImg: './img/01_권기옥.png',
                    backTxt: '권기옥',
                    connectionID: 1
                },
                {
                    backImg: './img/02_김명순.png',
                    backTxt: '김명순',
                    connectionID: 2
                },
                {
                    backImg: './img/02_김명순.png',
                    backTxt: '김명순',
                    connectionID: 2
                },
                {
                    backImg: './img/03_김점동.png',
                    backTxt: '김점동',
                    connectionID: 3
                },
                {
                    backImg: './img/03_김점동.png',
                    backTxt: '김점동',
                    connectionID: 3
                },
                {
                    backImg: './img/19_허정숙.png',
                    backTxt: '허정숙',
                    connectionID: 4
                },
                {
                    backImg: './img/19_허정숙.png',
                    backTxt: '허정숙',
                    connectionID: 4
                },
                {
                    backImg: './img/08_말랄라유사프자이.png',
                    backTxt: '말랄라 유사프자이',
                    connectionID: 5
                },
                {
                    backImg: './img/08_말랄라유사프자이.png',
                    backTxt: '말랄라 유사프자이',
                    connectionID: 5
                },
                {
                    backImg: './img/11_베르타카세레스.png',
                    backTxt: '베르타 카세레스',
                    connectionID: 6
                },
                {
                    backImg: './img/11_베르타카세레스.png',
                    backTxt: '베르타 카세레스',
                    connectionID: 6
                },
                {
                    backImg: './img/12_부춘화.png',
                    backTxt: '부춘화',
                    connectionID: 7
                },
                {
                    backImg: './img/12_부춘화.png',
                    backTxt: '부춘화',
                    connectionID: 7
                },
                {
                    backImg: './img/13_에멀린팽크허스트.png',
                    backTxt: '에멀린 팽크허스트',
                    connectionID: 8
                },
                {
                    backImg: './img/13_에멀린팽크허스트.png',
                    backTxt: '에멀린 팽크허스트',
                    connectionID: 8
                },
                {
                    backImg: './img/14_이태영.png',
                    backTxt: '이태영',
                    connectionID: 9
                },
                {
                    backImg: './img/14_이태영.png',
                    backTxt: '이태영',
                    connectionID: 9
                },
                {
                    backImg: './img/15_제인구달.png',
                    backTxt: '제인 구달',
                    connectionID: 10
                },
                {
                    backImg: './img/15_제인구달.png',
                    backTxt: '제인 구달',
                    connectionID: 10
                },
                {
                    backImg: './img/17_캐서린존슨.png',
                    backTxt: '캐서린 존슨',
                    connectionID: 11
                },
                {
                    backImg: './img/17_캐서린존슨.png',
                    backTxt: '캐서린 존슨',
                    connectionID: 11
                },
                {
                    backImg: './img/18_투유유.png',
                    backTxt: '투유유',
                    connectionID: 12
                },
                {
                    backImg: './img/18_투유유.png',
                    backTxt: '투유유',
                    connectionID: 12
                },
            ]
        });

        $('#btn-start-game12').click(function() {
            game12.generateCardSet();
            $('#btn-start-game8').addClass('hide');
            $('#btn-start-game12').addClass('hide');
            $('#btn-start-game20').addClass('hide');
            $('#btn-refresh').removeClass('hide');
            $('#level-game12').removeClass('hide');
            $('.wrapper_btn').addClass('hide');
        });

    });




var GAME20 = GAME20 || {};

GAME20.Game = (function() {

    var activeCards = [];
    var numOfCards;
    var cardHitCounter = 0;
    var card;
    var timer;
    var storage;

    /**
     * Method that will be invoked on card click
     */
    function handleCardClick() {

        var connection = $(this).data('connection');
        var hit;

        // Set card in active state
        // 'this' needs to be attached to context of card which is clicked
        if ( !$(this).hasClass('active') ) {
            $(this).addClass('active');
            activeCards.push($(this));

            // If user click on two cards then check
            if (activeCards.length == 2) {
                hit = checkActiveCards(activeCards);
            }

            if (hit === true) {
                cardHitCounter++;
                activeCards[0].add(activeCards[1]).unbind().addClass('wobble cursor-default');
                activeCards = [];

                // Game End
                if(cardHitCounter === (numOfCards / 2)) {
                    // Reset active cards
                    activeCards = [];
                    // Reset counter
                    cardHitCounter = 0;
                    // End game
                    endGame();
                }
            }
            // In case when user open more then 2 cards then automatically close first two
            else if(activeCards.length === 3) {
                for(var i = 0; i < activeCards.length - 1; i++) {
                    activeCards[i].removeClass('active');
                }
                activeCards.splice(0, 2);
            }
        }
    }

    function endGame() {
        timer.stopTimer();

        // Retrieve current time
        var time = timer.retrieveTime();

        // Retrieve time from storage
        var timeFromStorage = storage.retrieveBestTime();

        // if there's already time saved in storage check if it's better than current one
        if (timeFromStorage != undefined && timeFromStorage != '') {
            // if current game time is better than one saved in store then save new one
            if (time.minutes < timeFromStorage.minutes || (time.minutes == timeFromStorage.minutes && time.seconds < timeFromStorage.seconds) ) {
                storage.setBestTime(time);
            }
        }
        // else if time is not saved in storage save it
        else {
            storage.setBestTime(time);
        }

        // Update best time
        timer.updateBestTime();
    }

    function checkActiveCards(connections) {
        return connections[0].data('connection') === connections[1].data('connection');
    }

    return function(config) {

        /**
         * Main method for game initialization
         */
        this.startGame = function() {
            card = new GAME20.Card();
            timer = new GAME20.Timer();
            storage = new GAME20.Storage();
            numOfCards = config.cards.length;
            card.attachCardEvent(handleCardClick, config);
        };

        /**
         * After game initialization call this method in order to generate cards
         */
        this.generateCardSet = function() {
            // Generate new card set
            card.generateCards(config.cards);
            // Reset active cards array
            activeCards = [];

            // Reset timer
            timer.stopTimer();
            // Set timer
            timer.startTimer();
        };

        this.startGame();
    }

})();



GAME20.Card = (function () {

    // Private variables
    var $cardsContainer = $('#cards-container-game20');
    var $cardTemplate = $('#card-template-game20');

    /**
     * Private method
     * Take card template from DOM and update it with card data
     * @param {Object} card - card object
     * @return {Object} template - jquery object
     */
    function prepareCardTemplate (card) {
        var template = $cardTemplate
                            .clone()
                            .removeAttr('id')
                            .removeClass('hide')
                            .attr('data-connection', card.connectionID);

        // If card has background image
        if (card.backImg != '' ) {
            template.find('.back').css({
                'background': 'url(' + card.backImg + ') no-repeat center 10%',
                'background-size': '130%'
            });
        }
        // Else if card has no background image but has text
        if (card.backTxt != '') {
            template.find('.back > label').html(card.backTxt);
        }

        return template;
    }

    /**
     * Private method
     * Method for random shuffling array
     * @param {Object} cardsArray - array of card objects
     * @return {Object} returns random shuffled array
     */
    function shuffleCards(cardsArray) {
        var currentIndex = cardsArray.length, temporaryValue, randomIndex;

        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = cardsArray[currentIndex];
            cardsArray[currentIndex] = cardsArray[randomIndex];
            cardsArray[randomIndex] = temporaryValue;
        }

        return cardsArray;
    }

    return function() {

        /**
         * Public method
         * Prepare all cards and insert them into DOM
         * Before inserting new set of cards method will erase all previous cards
         * @param {Object} cards - array of card objects
         */
        this.generateCards = function(cards) {
            var templates = [];
            var preparedTemplate;

            // Prepare every card and push it to array
            cards.forEach(function (card) {
                preparedTemplate = prepareCardTemplate(card);
                templates.push(preparedTemplate);
            });

            // Shuffle card array
            templates = shuffleCards(templates);

            // Hide and empty card container
            $cardsContainer.hide().empty();

            // Append all cards to cards container
            templates.forEach(function(card) {
                $cardsContainer.append(card);
            });

            // Show card container
            $cardsContainer.fadeIn('slow');
        };

        /**
         * Public method
         * Attach click event on every card
         * Before inserting new set of cards method will erase all previous cards
         * @param {Function} func - function that will be invoked on card click
         */
        this.attachCardEvent = function(func) {
            $cardsContainer.unbind().on('click', '.flip-container', function() {
                func.call(this);
            });
        }
    }

})();

GAME20.Timer = (function() {

    var $timer = $('.timer');
    var $seconds = $timer.find('#seconds');
    var $minutes = $timer.find('#minutes');
    var $bestTimeContainer = $timer.find('.time');


    var minutes, seconds;

    function decorateNumber(value) {
        return value > 9 ? value : '0' + value;
    }

    return function() {
        var interval;
        var storage = new GAME20.Storage();

        this.startTimer = function() {
            var sec = 0;
            var bestTime;

            // Set timer interval
            interval = setInterval( function() {
                seconds = ++sec % 60;
                minutes = parseInt(sec / 60, 10);
                $seconds.html(decorateNumber(seconds));
                $minutes.html(decorateNumber(minutes));
            }, 1000);

            // Show timer
            $timer.delay(1000).fadeIn();

            this.updateBestTime();
        };

        this.updateBestTime = function() {
            // Check if user have saved best game time
            bestTime = storage.retrieveBestTime();
            if(bestTime != undefined && bestTime != '') {
                $bestTimeContainer
                    .find('#bestTime')
                    .text(bestTime.minutes + ':' + bestTime.seconds)
                    .end()
                    .fadeIn();
            }
        };

        this.stopTimer = function() {
            clearInterval(interval);
        };

        this.retrieveTime = function() {
            return {
                minutes: decorateNumber(minutes),
                seconds: decorateNumber(seconds)
            }
        };
    }
})();


GAME20.Storage = (function() {

    return function() {

        /**
         * Save best time to localStorage
         * key = 'bestTime'
         * @param {Object} time - object with keys: 'minutes', 'seconds'
         */
        this.setBestTime = function(time) {
            localStorage.setItem('bestTime', JSON.stringify(time));
        };

        /**
         * Retrieve best time from localStorage
         */
        this.retrieveBestTime = function() {
            return JSON.parse(localStorage.getItem('bestTime'));
        };

    }
})();



// Game init
$(function() {

        var game20 = new GAME20.Game({
            cards: [
                {
                    backImg: './img/01_권기옥.png',
                    backTxt: '권기옥',
                    connectionID: 1
                },
                {
                    backImg: './img/01_권기옥.png',
                    backTxt: '권기옥',
                    connectionID: 1
                },
                {
                    backImg: './img/02_김명순.png',
                    backTxt: '김명순',
                    connectionID: 2
                },
                {
                    backImg: './img/02_김명순.png',
                    backTxt: '김명순',
                    connectionID: 2
                },
                {
                    backImg: './img/03_김점동.png',
                    backTxt: '김점동',
                    connectionID: 3
                },
                {
                    backImg: './img/03_김점동.png',
                    backTxt: '김점동',
                    connectionID: 3
                },
                {
                    backImg: './img/04_플로랑스나이팅게일.png',
                    backTxt: '플로랑스 나이팅게일',
                    connectionID: 4
                },
                {
                    backImg: './img/04_플로랑스나이팅게일.png',
                    backTxt: '플로랑스 나이팅게일',
                    connectionID: 4
                },
                {
                    backImg: './img/05_나혜석.png',
                    backTxt: '나혜석',
                    connectionID: 5
                },
                {
                    backImg: './img/05_나혜석.png',
                    backTxt: '나혜석',
                    connectionID: 5
                },
                {
                    backImg: './img/06_로자파크스.png',
                    backTxt: '로자 파크스',
                    connectionID: 6
                },
                {
                    backImg: './img/06_로자파크스.png',
                    backTxt: '로자 파크스',
                    connectionID: 6
                },
                {
                    backImg: './img/07_마리암미르자하니.png',
                    backTxt: '마리암 미르자하니',
                    connectionID: 7
                },
                {
                    backImg: './img/07_마리암미르자하니.png',
                    backTxt: '마리암 미르자하니',
                    connectionID: 7
                },
                {
                    backImg: './img/08_말랄라유사프자이.png',
                    backTxt: '말랄라 유사프자이',
                    connectionID: 8
                },
                {
                    backImg: './img/08_말랄라유사프자이.png',
                    backTxt: '말랄라 유사프자이',
                    connectionID: 8
                },
                {
                    backImg: './img/09_박남옥.png',
                    backTxt: '박남옥',
                    connectionID: 9
                },
                {
                    backImg: './img/09_박남옥.png',
                    backTxt: '박남옥',
                    connectionID: 9
                },
                {
                    backImg: './img/10_버지니아울프.png',
                    backTxt: '버지니아 울프',
                    connectionID: 10
                },
                {
                    backImg: './img/10_버지니아울프.png',
                    backTxt: '버지니아 울프',
                    connectionID: 10
                },
                {
                    backImg: './img/11_베르타카세레스.png',
                    backTxt: '베르타 카세레스',
                    connectionID: 11
                },
                {
                    backImg: './img/11_베르타카세레스.png',
                    backTxt: '베르타 카세레스',
                    connectionID: 11
                },
                {
                    backImg: './img/12_부춘화.png',
                    backTxt: '부춘화',
                    connectionID: 12
                },
                {
                    backImg: './img/12_부춘화.png',
                    backTxt: '부춘화',
                    connectionID: 12
                },
                {
                    backImg: './img/13_에멀린팽크허스트.png',
                    backTxt: '에멀린 팽크허스트',
                    connectionID: 13
                },
                {
                    backImg: './img/13_에멀린팽크허스트.png',
                    backTxt: '에멀린 팽크허스트',
                    connectionID: 13
                },
                {
                    backImg: './img/14_이태영.png',
                    backTxt: '이태영',
                    connectionID: 14
                },
                {
                    backImg: './img/14_이태영.png',
                    backTxt: '이태영',
                    connectionID: 14
                },
                {
                    backImg: './img/15_제인구달.png',
                    backTxt: '제인 구달',
                    connectionID: 15
                },
                {
                    backImg: './img/15_제인구달.png',
                    backTxt: '제인 구달',
                    connectionID: 15
                },
                {
                    backImg: './img/16_차미리사.png',
                    backTxt: '차미리사',
                    connectionID: 16
                },
                {
                    backImg: './img/16_차미리사.png',
                    backTxt: '차미리사',
                    connectionID: 16
                },
                {
                    backImg: './img/17_캐서린존슨.png',
                    backTxt: '캐서린 존슨',
                    connectionID: 17
                },
                {
                    backImg: './img/17_캐서린존슨.png',
                    backTxt: '캐서린 존슨',
                    connectionID: 17
                },
                {
                    backImg: './img/18_투유유.png',
                    backTxt: '투유유',
                    connectionID: 18
                },
                {
                    backImg: './img/18_투유유.png',
                    backTxt: '투유유',
                    connectionID: 18
                },
                {
                    backImg: './img/19_허정숙.png',
                    backTxt: '허정숙',
                    connectionID: 19
                },
                {
                    backImg: './img/19_허정숙.png',
                    backTxt: '허정숙',
                    connectionID: 19
                },
                {
                    backImg: './img/20_헬렌켈러.png',
                    backTxt: '헬렌 켈러',
                    connectionID: 20
                },
                {
                    backImg: './img/20_헬렌켈러.png',
                    backTxt: '헬렌 켈러',
                    connectionID: 20
                },
            ]
        });

        $('#btn-start-game20').click(function() {
            game20.generateCardSet();
            $('#btn-start-game8').addClass('hide');
            $('#btn-start-game12').addClass('hide');
            $('#btn-start-game20').addClass('hide');
            $('#btn-refresh').removeClass('hide');
            $('#level-game20').removeClass('hide');
            $('.wrapper_btn').addClass('hide');
        });

    });
