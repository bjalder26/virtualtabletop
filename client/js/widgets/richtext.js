import { Widget } from './widget.js';

export class Richtext extends Widget {
  constructor(id) {
    super(id);
    this.input = document.createElement('div');

    this.addDefaults({
      movable: false,
      layer: -2,
      typeClasses: 'widget richtext',

      backgroundColor: null,
      borderColor: 'transparent',
	  borderStyle: 'none',
	  borderWidth: 0,
	  color: 'black',
	  image: '',
	  padding: null,
	  svgReplaces: {},
	  text: '',
      textColor: 'black'
    });

    this.domElement.appendChild(this.input);
  }

  applyDeltaToDOM(delta) {
    super.applyDeltaToDOM(delta);
    if(delta.text !== undefined) {
      var richtext = this.get('text').toString()
      .replace(/=/gimu, '&#61')
      .replace(/style&#61/gmi, 'style=')
	  .replace(/src&#61/gmi, 'src=')
	  .replace(/height&#61/gmi, 'height=')
	  .replace(/width&#61/gmi, 'width=')
      .replace(/class&#61/gmi, 'class=')
      .replace(/color&#61/gmi, 'color=')
      .replace(/face&#61/gmi, 'face=')
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
	if(this.get('borderStyle'))
      css += '; --borderStyle:' + this.get('borderStyle');
    if(this.get('backgroundColor'))
      css += '; --wcMain:' + this.get('backgroundColor');
    if(this.get('borderType'))
      css += '; --borderStyle:' + this.get('borderStyle');
    if(this.get('borderStyle'))
      css += '; --wcBorder:' + this.get('borderColor');
    if(this.get('image'))
      css += '; background-image: url("' + this.getImage() + '")';
    if(this.get('textColor'))
      css += '; --wcFont:' + this.get('textColor');
  let a = this.cssPxOrPercent('padding', 'padding', true);
    if(this.get('padding'))
      css += '; --padding:' + this.cssPxOrPercent('padding', 'padding', true);
    if(this.get('borderWidth'))
      css += ' --borderWidth:' + this.cssPxOrPercent('borderWidth', 'border-width', true);
    return css;
  }

  cssProperties() {
    const p = super.cssProperties();
    p.push('backgroundColor', 'borderColor', 'textColor', 'image', 'svgReplaces', 'borderStyle');
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
