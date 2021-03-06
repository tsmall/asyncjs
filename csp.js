"use strict";

let Movies = window.Movies;
let Random = window.Random;
let csp = require('csp');

let CSP = {

    getNumbers: (startNumber, endNumber) => {
        let out = csp.chan();
        csp.go(function*() {
            for (var i = startNumber; i <= endNumber; i++) {
                yield csp.take(csp.timeout(500));
                yield csp.put(out, i);
            }
            out.close();
        });
        return out;
    },

    getCategories: () => {
        let out = csp.chan();
        csp.go(function*() {
            yield csp.take(csp.timeout(Random.milliseconds()));

            for (let category of Movies.categories) {
                yield csp.put(out, category);
            }
            out.close();
        });
        return out;
    },

    getMoviesInCategory: (category) => {
        let out = csp.chan();
        csp.go(function*() {
            yield csp.take(csp.timeout(Random.milliseconds()));

            let movies = Movies.getMoviesInCategory(category);
            for (let movie of movies) {
                yield csp.put(out, movie);
            }
            out.close();
        });
        return out;
    },

    flatMapFrom: (f, ch) => {
        let out = csp.chan();
        csp.go(function*() {
            let val, doneChs = [];
            while ((val = yield csp.take(ch)) !== csp.CLOSED) {
                let mapCh = f(val);
                let done = csp.chan();
                doneChs.push(done);
                csp.go(function*() {
                    let mapChVal;
                    while ((mapChVal = yield csp.take(mapCh)) !== csp.CLOSED) {
                        yield csp.put(out, mapChVal);
                    }
                    done.close();
                });
            }

            let allDone = csp.operations.merge(doneChs);
            while ((yield csp.take(allDone)) !== csp.CLOSED) {}
            out.close();
        });
        return out;
    }

};

let CSPExamples = [
    {
        title: "Intro to CSP",
        run: (logger) => {
            csp.go(function*() {
                let numberChan = CSP.getNumbers(1, 10);
                while (true) {
                    let number = yield csp.take(numberChan);
                    if (number === csp.CLOSED) break;

                    logger("Got number from channel: " + number);
                }
                logger("Channel closed.");
            });
        }
    },
    {
        title: "Get Movies (CSP)",
        run: (logger) => {
            csp.go(function*() {
                let categoryChan = CSP.getCategories();
                while (true) {
                    let category = yield csp.take(categoryChan);
                    if (category === csp.CLOSED) break;

                    csp.go(function*() {
                        let movieChan = CSP.getMoviesInCategory(category);
                        while (true) {
                            let movie = yield csp.take(movieChan);
                            if (movie === csp.CLOSED) break;

                            logger(category + ' - ' + movie);
                        }
                    });
                }
            });
        }
    },
    {
        title: "Get Movies with Indicator (CSP)",
        run: (logger) => {
            csp.go(function*() {
                logger("Starting loading...");

                let categoryChan = CSP.getCategories();
                let movieOutChans = [];
                while (true) {
                    let category = yield csp.take(categoryChan);
                    if (category === csp.CLOSED) break;

                    let out = csp.chan();
                    movieOutChans.push(out);
                    csp.go(function*() {
                        let movieChan = CSP.getMoviesInCategory(category);
                        while (true) {
                            let movie = yield csp.take(movieChan);
                            if (movie === csp.CLOSED) break;

                            let movieInfo = {category: category, movie: movie};
                            yield csp.put(out, movieInfo);
                        }
                        out.close();
                    });
                }

                let movieChan = csp.operations.merge(movieOutChans);
                while (true) {
                    let movieInfo = yield csp.take(movieChan);
                    if (movieInfo === csp.CLOSED) break;

                    logger(movieInfo.category + ' - ' + movieInfo.movie);
                }

                logger("Loading finished.");
            });
        }
    },
    {
        title: "Get Movies with Indicator (FRP style CSP)",
        run: (logger) => {
            csp.go(function*() {
                logger("Started loading...");

                let movieChan = CSP.flatMapFrom(
                    category => {
                        return csp.operations.mapFrom(
                            movie => [category, movie],
                            CSP.getMoviesInCategory(category)
                        );
                    },
                    CSP.getCategories()
                );

                while (true) {
                    let kvp = yield csp.take(movieChan);
                    if (kvp === csp.CLOSED) break;

                    logger(kvp[0] + ' - ' + kvp[1]);
                }

                logger("Loading finished.");
            });
        }
    },
    {
        title: "Get Movies with Timeout (CSP)",
        run: (logger) => {
            csp.go(function*() {
                logger("Started loading...");

                let movieChan = CSP.flatMapFrom(
                    category => {
                        let out = csp.chan();
                        csp.go(function*() {
                            let movieChan = csp.operations.mapFrom(
                                movie => [category, movie],
                                CSP.getMoviesInCategory(category)
                            );
                            let timeoutChan = csp.timeout(500);

                            while (true) {
                                let result = yield csp.alts([movieChan, timeoutChan]);
                                if (result.channel === movieChan) {
                                    if (result.value === csp.CLOSED) break;
                                    yield csp.put(out, result.value);
                                }
                                else {
                                    logger(category + ' - Timed out!');
                                    break;
                                }
                            }
                            out.close();
                        });
                        return out;
                    },
                    CSP.getCategories()
                );

                while (true) {
                    let kvp = yield csp.take(movieChan);
                    if (kvp === csp.CLOSED) break;

                    logger(kvp[0] + ' - ' + kvp[1]);
                }

                logger("Loading finished.");
            });
        }
    }
];
