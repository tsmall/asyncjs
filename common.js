let Movies = {
    categories: ["Action", "Drama", "Horror"],
    actionMovies: ["300", "Sin City"],
    dramaMovies: ["Eyes Wide Shut", "Saving Private Ryan"],
    horrorMovies: ["The Ring", "The Conjuring"]
};

let Example = {

    load: function(helpers, example) {
        let title = this._getElement('h1');
        title.innerHTML = example.title;

        let helpersPre = this._getElement('.code-helpers');
        helpersPre.contentEditable = true;
        helpersPre.spellcheck = false;
        helpersPre.innerHTML = this._objToString(helpers);

        let examplePre = this._getElement('.code-example');
        examplePre.contentEditable = true;
        examplePre.spellcheck = false;
        examplePre.innerHTML = this._fnToString(example.run);

        Logger.clear();

        let evalHelpers = this._evalCode.bind(this, helpersPre);
        let evalExample = this._evalCode.bind(this, examplePre);
        let button = this._getElement('button');
        button.onclick = () => {
            Logger.clear();
            evalHelpers();
            evalExample()(Logger.log.bind(Logger));
        };
    },

    _evalCode: function(codePre) {
        let code = codePre.innerHTML.replace(/&gt;/g, '>').replace(/<br>/g, '\n');
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
        if (obj === window.FRP) {
            return 'FRP';
        }
        else if (obj === window.CSP) {
            return 'CSP';
        }
        else {
            throw new Error("Unknown obj: " + obj);
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
     * init creates the sidebar links from the actual
     * example code, hooking them up so clicking on one will load that
     * example's code in the example runner.
     */
    init: function() {
        let exampleSections = [
            {title: 'FRP', helpers: window.FRP, examples: window.FRPExamples},
            {title: 'CSP', helpers: window.CSP, examples: window.CSPExamples}
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
