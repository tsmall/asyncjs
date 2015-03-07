"use strict";

let Movies = {
    categories: ["Action", "Drama", "Horror"],

    actionMovies: ["300", "Sin City"],
    dramaMovies: ["Eyes Wide Shut", "Saving Private Ryan"],
    horrorMovies: ["The Ring", "The Conjuring"],

    getMoviesInCategory: category => {
        let movies = [];
        if (category === "Action") movies = Movies.actionMovies;
        if (category === "Drama") movies = Movies.dramaMovies;
        if (category === "Horror") movies = Movies.horrorMovies;
        return movies;
    }
};

let Example = {

    helpersEditor: null,
    exampleEditor: null,

    init: function() {
        this.helpersEditor = ace.edit('helpers-editor');
        this.helpersEditor.setTheme("ace/theme/solarized_light");
        this.helpersEditor.getSession().setMode("ace/mode/javascript");

        this.exampleEditor = ace.edit('example-editor');
        this.exampleEditor.setTheme("ace/theme/solarized_light");
        this.exampleEditor.getSession().setMode("ace/mode/javascript");
    },

    load: function(helpers, example) {
        let title = this._getElement('h1');
        title.innerHTML = example.title;

        this.helpersEditor.setValue(this._objToString(helpers));
        this.helpersEditor.navigateTo(0, 0);

        this.exampleEditor.setValue(this._fnToString(example.run));
        this.exampleEditor.navigateTo(0, 0);

        Logger.clear();

        let evalHelpers = this._evalCode.bind(this, this.helpersEditor);
        let evalExample = this._evalCode.bind(this, this.exampleEditor);
        let button = this._getElement('button');
        button.onclick = () => {
            Logger.clear();
            evalHelpers();
            evalExample()(Logger.log.bind(Logger));
        };
    },

    refreshEditors: function() {
        this.helpersEditor.resize();
        this.exampleEditor.resize();
    },

    _evalCode: function(editor) {
        let code = editor.getValue();
        return eval(code);
    },

    _getElement: function(selector) {
        return document.querySelector(['.example', selector].join(' '));
    },

    /**
     * _fnToString returns a nicely formatted string representation of
     * the function fn's source code.
     */
    _fnToString: function(fn) {
        return this._fixLeadingSpaces(fn.toString());
    },

    /**
     * _fixLeadingSpaces fixes the leading spaces in the code string
     * so that four spaces are used for indents.  It does this using a
     * heuristic, assuming that the second line should be indented
     * once stop.  It returns a new string containing the fixed code.
     */
    _fixLeadingSpaces: function(code) {
        let lines = code.split('\n');
        if (lines.length === 1) {
            return code;
        }

        let extraLeadingSpaces = this._countLeadingSpaces(lines[1]) - 4;
        if (extraLeadingSpaces <= 0) {
            return code;
        }

        return lines.
            map(line => line.startsWith(' ') ? line.substring(extraLeadingSpaces) : line).
            join('\n');
    },

    /**
     * _countLeadingSpaces returns the number of leading spaces in str.
     */
    _countLeadingSpaces: function(str) {
        let count = 0;
        for (let c of str) {
            if (c !== ' ') {
                break;
            }
            count++;
        }
        return count;
    },

    _objToString: function(obj) {
        let objName = this._getObjName(obj);
        let source = [];
        for (let prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                source.push(objName + '.' + prop + ' = ' + this._fnToString(obj[prop]));
                source.push('');
            }
        }
        return source.join('\n');
    },

    _getObjName: function(obj) {
        switch (obj) {
        case window.ES6Intro: return 'ES6Intro';
        case window.Intro: return 'Intro';
        case window.Callbacks: return 'Callbacks';
        case window.FP: return 'FP';
        case window.Promises: return 'Promises';
        case window.FRP: return 'FRP';
        case window.RxFRP: return 'RxFRP';
        case window.GenHelp: return 'GenHelp';
        case window.CSP: return 'CSP';
        default: throw new Error("Unknown obj: " + obj);
        }
    }

};

/**
 * Logger is an object for logging an example's output to the page.
 */
let Logger = {

    /**
     * log logs a text message to the output log.
     */
    log: function(text) {
        let outputElement = this._getOutputElement();
        outputElement.innerHTML = outputElement.innerHTML + text + '<br>';
    },

    /**
     * clear deletes all text in the output log, clearing it back to
     * an empty state.
     */
    clear: function() {
        this._getOutputElement().innerHTML = '';
    },

    /**
     * _getOutputElement gets the HTML element Logger should log in.
     */
    _getOutputElement: function() {
        if (!this._outputElement) {
            this._outputElement = document.querySelector('.output');
        }
        return this._outputElement;
    }

};

/**
 * Sidebar is an object for managing the example sidebar.
 */
let Sidebar = {

    /**
     * init creates the sidebar links from the actual example code,
     * hooking them up so clicking on one will load that example's
     * code in the example runner.
     */
    init: function() {
        let w = window;
        let exampleSections = [
            {title: 'Intro to ES6', helpers: w.ES6Intro, examples: w.ES6IntroExamples},
            {title: 'Example data', helpers: w.Intro, examples: w.IntroExamples},
            {title: 'Callbacks', helpers: w.Callbacks, examples: w.CallbackExamples},
            {title: 'FP', helpers: w.FP, examples: w.FPExamples},
            {title: 'Promises', helpers: w.Promises, examples: w.PromiseExamples},
            {title: 'FRP', helpers: w.FRP, examples: w.FRPExamples},
            {title: 'RxFRP', helpers: w.RxFRP, examples: w.RxExamples},
            {title: 'Generators', helpers: w.GenHelp, examples: w.GenExamples},
            {title: 'CSP', helpers: w.CSP, examples: w.CSPExamples}
        ];

        let containers = exampleSections.map(this._createExampleSection.bind(this));
        let sidebar = document.querySelector('aside');
        containers.forEach(section => sidebar.appendChild(section));
    },

    /**
     * _createExampleSection returns a new HTML element containing
     * information about and links for loading a group of
     * examples. The exampleGroup is an object with three properties:
     *
     *   - title: the name of the section
     *   - helpers: the object containing the example's helper functions
     *   - examples: the array containing the examples
     */
    _createExampleSection: function(exampleGroup) {
        let section = document.createElement('div');
        section.appendChild(this._createHeader(exampleGroup.title));
        section.appendChild(this._createLinks(exampleGroup.examples, exampleGroup.helpers));
        return section;
    },

    /**
     * _createHeader returns a new HTML element containing an example
     * group's title.
     */
    _createHeader: function(text) {
        let header = document.createElement('h2');
        header.innerHTML = text;
        return header;
    },

    /**
     * _createLinks returns a new HTML element containing links for
     * each of the examples.  When the links are clicked, the
     * associated example is loaded.
     */
    _createLinks: function(examples, helpers) {
        let list = document.createElement('ul');
        examples.
            map(ex => {
                let link = document.createElement('a');
                link.href = '#';
                link.innerHTML = ex.title;
                link.onclick = (event) => {
                    event.preventDefault();
                    Example.load(helpers, ex);
                };

                let li = document.createElement('li');
                li.appendChild(link);
                return li;
            }).
            forEach(li => list.appendChild(li));
        return list;
    }

};

/**
 * Toggler is an object that controlls toggling an element between
 * visible and hidden.  It works in concert with a clickable element,
 * which must have a data-target attribute specifying the CSS selector
 * of the element to toggle.
 */
let Toggler = {

    /**
     * init performs initialization for a newly cloned object made
     * with Object.create.  It requires the clickable control element
     * to be provided along with the text to use in the control for
     * the "show" and "hide" actions.
     */
    init: function(clickableControl, hideText, showText) {
        this._visible = true;
        this._hideText = hideText;
        this._showText = showText;

        this._clickableControl = clickableControl;
        this._setControlText();
        this._addClickHandler();

        this._target = document.querySelector(clickableControl.dataset.target);
        this._originalDisplay = this._target.style.display;

        this._onVisibleCallback = null;

        // Start with the toggler hidden.
        this.toggle();

        return this;
    },

    /**
     * toggle toggles between visible and hidden.
     */
    toggle: function() {
        this._visible = !this._visible;
        this._setVisibility();
        this._setControlText();

        if (this._visible && this._onVisibleCallback)
            this._onVisibleCallback();
    },

    onVisible: function(callback) {
        this._onVisibleCallback = callback;
    },

    /**
     * _setVisibility sets the target element's visibility based on
     * this object's current toggle state.
     */
    _setVisibility: function() {
        this._visible
            ? this._target.style.display = this._originalDisplay
            : this._target.style.display = 'none';
    },

    /**
     * _setControlText sets the clickable control element's text based
     * on this object's current toggle state.
     */
    _setControlText: function() {
        this._clickableControl.innerHTML = this._visible
            ? this._hideText
            : this._showText;
    },

    /**
     * _addClickHandler sets up the clickable control element's click
     * handler.
     */
    _addClickHandler: function() {
        let self = this;
        this._clickableControl.addEventListener('click', (event) => {
            event.preventDefault();
            self.toggle();
        });
    }

};

/**
 * Random is an object that provides random numbers.
 */
let Random = {

    /**
     * Get a random number of milliseconds, from 0 to 1000.
     */
    milliseconds: () => Math.round(Math.random() * 1000, 0)

};
