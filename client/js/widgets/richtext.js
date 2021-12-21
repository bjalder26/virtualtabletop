import { Widget } from './widget.js';

export class Richtext extends Widget {
  constructor(id) {
    super(id);
    this.input = document.createElement('div');

    this.addDefaults({
      movable: false,
      layer: -2,
      typeClasses: 'widget richtext',

      backgroundColor: 'transparent',
      borderColor: 'transparent',
      color: '#6d6d6d',
      image: '',
      svgReplaces: {},
      text: ''
    });

    this.domElement.appendChild(this.input);
  }

  applyDeltaToDOM(delta) {
    super.applyDeltaToDOM(delta);
    if(delta.text !== undefined) {
      var richtext = this.get('text').toString()

      .replace(/=/gimu, '&#61')
      .replace(/style&#61/gmi, 'style=')
      .replace(/class&#61/gmi, 'class=')
      .replace(/<a href&#61(?:'|")(?:https)(.+?)(?:'|")>/gmi, "<a href='https$1' rel='noopener noreferrer nofollow'>")
      .replace(/<a href&#61(?:'|")(?:http)(.+?)(?:'|")>/gmi, "<a href='https$1' rel='noopener noreferrer nofollow'>")
      .replace(/<a href&#61(?:'|")(?:www)(.+?)(?:'|")>/gmi, "<a href='https://www$1' rel='noopener noreferrer nofollow'>")
      .replace(/<a href&#61(?:'|")(?:\/)(.+?)(?:'|")>/gmi, "<a href='/$1' rel='noopener noreferrer nofollow'>")
      .replace(/<a href&#61(?:'|")(.+?)(?:'|")>/gmi, "<a href='https://www.$1' rel='noopener noreferrer nofollow'>")

      this.input.innerHTML = richtext;
    }
  }

    css() {
    let css = super.css();
    if(this.get('backgroundColor'))
      css += '; --wcMain:' + this.get('backgroundColor');
    if(this.get('borderColor'))
      css += '; --wcBorder:' + this.get('borderColor');
    if(this.get('image'))
      css += '; background-image: url("' + this.getImage() + '")';

    return css;
  }

  cssProperties() {
    const p = super.cssProperties();
    p.push('backgroundColor', 'borderColor', 'image', 'svgReplaces');
    return p;
  }

  getImage() {
    if(!Object.keys(this.get('svgReplaces')).length)
      return this.get('image');

    const replaces = {};
    for(const key in this.get('svgReplaces'))
      replaces[key] = this.get(this.get('svgReplaces')[key]);
    return getSVG(this.get('image'), replaces, _=>this.domElement.style.cssText = this.css());
  }
}
