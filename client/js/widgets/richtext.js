import { Widget } from './widget.js';

export class Richtext extends Widget {
  constructor(id) {
    super(id);
    this.input = document.createElement('div');

    this.addDefaults({
      height: 20,
      movable: false,
      layer: -2,
      typeClasses: 'widget richtext',

      text: ''
    });

    this.domElement.appendChild(this.input);
  }

  applyDeltaToDOM(delta) {
    super.applyDeltaToDOM(delta);
    if(delta.text !== undefined) {
      var richtext = this.get('text').toString()
      .replace(/</gmi, '&lt;')
      .replace(/>/gmi, '&gt;')
      .replace(/&lt;b&gt;/gmi, '<b>')
      .replace(/&lt;\/b&gt;/gmi, '</b>')
      .replace(/&lt;i&gt;/gmi, '<i>')
      .replace(/&lt;\/i&gt;/gmi, '</i>')
      
      .replace(/&lt;u&gt;/gmi, '<u>')
      .replace(/&lt;\/u&gt;/gmi, '</u>')
      
      .replace(/&lt;br&gt;/gmi, '<br>')
      .replace(/&lt;p&gt;/gmi, '<p>')
      .replace(/&lt;\/p&gt;/gmi, '</p>')
      
      .replace(/&lt;ol&gt;/gmi, '<ol>')
      .replace(/&lt;\/ol&gt;/gmi, '</ol>')
      .replace(/&lt;ul&gt;/gmi, '<ul>')
      .replace(/&lt;\/ul&gt;/gmi, '</ul>')
      .replace(/&lt;li&gt;/gmi, '<li>')
      .replace(/&lt;\/li&gt;/gmi, '</li>')
      
      .replace(/&lt;table&gt;/gmi, '<table>')
      .replace(/&lt;\/table&gt;/gmi, '</table>')
      .replace(/&lt;th&gt;/gmi, '<th>')
      .replace(/&lt;\/th&gt;/gmi, '</th>')
      .replace(/&lt;tr&gt;/gmi, '<tr>')
      .replace(/&lt;\/tr&gt;/gmi, '</tr>')
      .replace(/&lt;td&gt;/gmi, '<td>')
      .replace(/&lt;\/td&gt;/gmi, '</td>')
      .replace(/&lt;thead&gt;/gmi, '<thead>')
      .replace(/&lt;\/thead&gt;/gmi, '</thead>')
      .replace(/&lt;tbody&gt;/gmi, '<tbody>')
      .replace(/&lt;\/tbody&gt;/gmi, '</tbody>')
      .replace(/&lt;tfoot&gt;/gmi, '<tfoot>')
      .replace(/&lt;\/tfoot&gt;/gmi, '</tfoot>')
      
      .replace(/&lt;sub&gt;/gmi, '<sub>')
      .replace(/&lt;\/sub&gt;/gmi, '</sub>')
      .replace(/&lt;sup&gt;/gmi, '<sup>')
      .replace(/&lt;\/sup&gt;/gmi, '</sup>')
      
      .replace(/&lt;select name='(.+?)'&gt;/gmi, "<select name='$1'>")
      .replace(/&lt;\/select&gt;/gmi, '</select>')
      .replace(/&lt;option value='(.+?)'&gt;/gmi, "<option value='$1'>")
      .replace(/&lt;\/option&gt;/gmi, '</option>')
      
      .replace(/&lt;a href='(https|http)(.+?)'&gt;/gmi, "<a href='https$2' rel='noopener noreferrer nofollow'>")
      .replace(/&lt;\/a&gt;/gmi, '</a>')
      
      .replace(/&lt;span style='(.+?)'&gt;/gmi, "<span style='$1'>")
      .replace(/&lt;span class='(.+?)'&gt;/gmi, "<span class='$1'>")
      .replace(/&lt;\/span&gt;/gmi, '</span>')
      
      .replace(/&lt;h1&gt;/gmi, '<h1>')
      .replace(/&lt;\/h1&gt;/gmi, '</h1>')
      .replace(/&lt;h2&gt;/gmi, '<h2>')
      .replace(/&lt;\/h2&gt;/gmi, '</h2>')
      .replace(/&lt;h3&gt;/gmi, '<h3>')
      .replace(/&lt;\/h3&gt;/gmi, '</h3>')
      .replace(/&lt;h4&gt;/gmi, '<h4>')
      .replace(/&lt;\/h4&gt;/gmi, '</h4>')
      .replace(/&lt;h5&gt;/gmi, '<h5>')
      .replace(/&lt;\/h5&gt;/gmi, '</h5>')
      .replace(/&lt;h6&gt;/gmi, '<h6>')
      .replace(/&lt;\/h6&gt;/gmi, '</h6>')
            
      this.input.innerHTML = richtext;
    }
  }
}
