import $ from 'jquery';
global.$ = global.jQuery = $;
global.alert = jest.fn()
global.$.modal = jest.fn()