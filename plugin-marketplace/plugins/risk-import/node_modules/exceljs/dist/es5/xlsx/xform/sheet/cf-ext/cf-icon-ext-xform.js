"use strict";

const BaseXform = require('../../base-xform');
class CfIconExtXform extends BaseXform {
  get tag() {
    return 'x14:cfIcon';
  }
  render(xmlStream, model) {
    xmlStream.leafNode(this.tag, {
      iconSet: model.iconSet,
      iconId: model.iconId
    });
  }
  parseOpen(_ref) {
    let {
      attributes
    } = _ref;
    this.model = {
      iconSet: attributes.iconSet,
      iconId: BaseXform.toIntValue(attributes.iconId)
    };
  }
  parseClose(name) {
    return name !== this.tag;
  }
}
module.exports = CfIconExtXform;
//# sourceMappingURL=cf-icon-ext-xform.js.map
