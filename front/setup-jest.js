console.log('setup-jest.js est en cours d’exécution');
import $ from 'jquery';
console.log($); // Ceci devrait afficher la fonction jQuery dans la console
global.$ = global.jQuery = $;
