import { parse } from 'node-html-parser';
const TEXT_NODE = 3;

var code = `
    <template scope="myscope"><div height="10"><input value={{AbCd}}></input><h1>{{AbCd}}</h1></div></template>
    <script>
        var sc = fnew.createScope("myscope");
        sc.AbCd = "Hello World";
    </script>
`;

var ast = parse(code).querySelector('template');  
console.log(ast);

processAst(ast);

var dom = document.getElementById('root');

ast.childNodes.forEach(child => createElement(child, dom));

function createElement(element, container) {
    var domNode = 
        element.tagName 
            ? document.createElement(element.tagName)
            : document.createTextNode(element.rawText);

    // console.log({element, container})
    
    if(element.attributes) {
        Object.keys(element.attributes)
            .forEach(function addAttributeToDomNode(attr) {
                domNode[attr] = element.attributes[attr];
            });
    }
    

    container.appendChild(domNode);
    element.childNodes.forEach(child => createElement(child, domNode));
    return domNode;
}


function processAst(ast) {
    if(ast.nodeType === TEXT_NODE) {
        let variables = ast.rawText.match(/{{.*}}/g);
        console.log(variables);
    }
    ast.childNodes.forEach(child => processAst(child));
}