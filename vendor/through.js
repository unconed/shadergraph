/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Synchronous stream wrapper for glsl tokenizer/parser

const through = function(write, end) {
  const output = [];
  const errors = [];

  return {
    output,
    parser: null,
    write,
    end,

    process(parser, data) {
      this.parser = parser;
      write(data);
      this.flush();
      return this.parser.flush();
    },

    flush() {
      end();
      return [output, errors];
    },

    // From tokenizer
    queue(obj) {
      if (obj != null) { return (this.parser != null ? this.parser.write(obj) : undefined); }
    },

    // From parser
    emit(type, node) {
      if (type === 'data') {
        if ((node.parent == null)) {
          output.push(node);
        }
      }
      if (type === 'error') {
        return errors.push(node);
      }
    }
  };
};

module.exports = through;