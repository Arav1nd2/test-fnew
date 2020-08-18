import parser from './index';
// const util = require('util');

test('basic ast generation', () => {
    let input = `
        <template>
            <h1 class="container" height="50" name="hel" >Hello World</h1>
            <p>Lorem ipsum dolor</p>
        </template>
    `;
    let ast = parser(input);
    // console.log(util.inspect(ast, false, null, true));
    expect(ast).toEqual({
        type: 'template',
        attributes: {},
        children: [
            {
                type: 'h1',
                attributes: {class: 'container', height: '50', name: 'hel'},
                children: [{
                    text: 'Hello World'
                }]
            }, {
                type: 'p',
                attributes: {},
                children: [{
                    text: 'Lorem ipsum dolor'
                }]
            }
        ]
    })
})
