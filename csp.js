let Movies = window.Movies;
let csp = require('csp');

let CSP = {

    getCategories: () => {
        let out = csp.chan();
        csp.go(function*() {
            for (let category of Movies.categories) {
                yield csp.take(csp.timeout(500));
                yield csp.put(out, category);
            }
            out.close();
        });
        return out;
    },

    getMoviesInCategory: (category) => {
        let out = csp.chan();
        csp.go(function*() {
            let movies = [];
            if (category === "Action") movies = Movies.actionMovies;
            if (category === "Drama") movies = Movies.dramaMovies;
            if (category === "Horror") movies = Movies.horrorMovies;

            for (let movie of movies) {
                yield csp.take(csp.timeout(1000));
                yield csp.put(out, movie);
            }
            out.close();
        });
        return out;
    }

};

let CSPExamples = [
    {
        title: "Get Movies (CSP)",
        run: (logger) => {
            csp.go(function*() {
                let categoryChan = CSP.getCategories();
                while (!categoryChan.closed) {
                    let category = yield csp.take(categoryChan);
                    csp.go(function*() {
                        let movieChan = CSP.getMoviesInCategory(category);
                        while (!movieChan.closed) {
                            let movie = yield csp.take(movieChan);
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
                let movieDoneSignals = [];
                while (!categoryChan.closed) {
                    let category = yield csp.take(categoryChan);

                    let done = csp.chan();
                    movieDoneSignals.push(done);
                    csp.go(function*() {
                        let movieChan = CSP.getMoviesInCategory(category);
                        while (!movieChan.closed) {
                            let movie = yield csp.take(movieChan);
                            logger(category + ' - ' + movie);
                        }
                        done.close();
                    });
                }

                let allDone = csp.operations.merge(movieDoneSignals);
                while (!allDone.closed) {
                    yield csp.take(allDone);
                }

                logger("Loading finished.");
            });
        }
    }
];
