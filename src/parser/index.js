/********** Deps**********/
import {
    Lexer, 
    createToken,
    CstParser
} from 'chevrotain';

/********** Public API **********/
export default generateAST;

/********** Implementation **********/

/***** Lexer *****/
const openTagStart = createToken({name: 'openTagStart', pattern: /<[a-zA-Z]\w*/})
const openTagEnd = createToken({name: 'openTagEnd', pattern: /\s*>/});
const closingTag = createToken({name: 'closingTag', pattern: /<\/[a-zA-Z]\w*>/})
const attribute = createToken({name: 'attribute', pattern: /[a-zA-Z]\w*(\s)*=/});
const whitespace = createToken({name: 'whitespace', pattern:/\s+/});
const value = createToken({name: 'value', pattern: /"([^"]*)"/});
const interpolation = createToken({name: 'interpolation', pattern: /{{[a-zA-Z]\w*}}/});
const text = createToken({name: 'text', pattern: /[^<>]+/});

var allTokens = [
    openTagStart,
    openTagEnd,
    closingTag,
    attribute,
    whitespace,
    value,
    interpolation,
    text
];

/***** Parser *****/
class HtmlxParser extends CstParser {
    constructor() {
        super(allTokens);
        const $ = this;

        $.RULE('HTMLX', () => {
            $.OR([{
                    ALT: () => {
                        $.OPTION(() => {$.CONSUME(whitespace)})
                        $.SUBRULE($.OpeningTag)
                        $.MANY(() => {$.SUBRULE($.HTMLX)})
                        $.CONSUME(closingTag)
                        $.OPTION1(() => {$.CONSUME1(whitespace)})
                    }
                }, {
                    ALT: () => {$.CONSUME(text)}
                }
            ])
        })

        $.RULE('OpeningTag', () => {
            $.CONSUME(openTagStart)
            $.OPTION(() => {
                $.CONSUME(whitespace)
                $.MANY_SEP({
                    SEP: whitespace,
                    DEF: () => {
                        $.SUBRULE($.Attribute)
                    }
                })
            })
            $.CONSUME(openTagEnd)
        })

        $.RULE('Attribute', () => {
            $.CONSUME(attribute)
            $.CONSUME(value)
        })

        this.performSelfAnalysis();
    }
}

var htmlxLexer = new Lexer(allTokens);
var parser = new HtmlxParser();
var BaseHTMLXVisitor = parser.getBaseCstVisitorConstructor();


/***** Semantic Analyzer *****/
class HTMLXVisitor extends BaseHTMLXVisitor {
    constructor() {
        super();
        this.validateVisitor();
    }

    HTMLX(ctx) {
        
        if(ctx.HTMLX) {
            var openingTag, attributes, closingTag, children;
            ({tag: openingTag, attributes} = this.visit(ctx.OpeningTag));
            children = ctx.HTMLX.map(child => this.visit(child));
            closingTag = ctx.closingTag[0].image;
            closingTag = closingTag.slice(2, -1);
            if(openingTag !== closingTag) throw new Error(`Mismatch in opening tag ${openingTag} and closing tag ${closingTag}`);

            return {
                type: openingTag,
                attributes,
                children
            }

        } else {
            return {text: ctx.text[0].image}
        }
    }

    OpeningTag(ctx) {
        var attributes = {};
        if(ctx.Attribute) ctx.Attribute.forEach(att => this.visit(att, attributes));
        var tag = ctx.openTagStart[0].image.slice(1);
        return {
            tag,
            attributes
        }
    }

    Attribute(ctx, attributes) {
        attributes[ctx.attribute[0].image.slice(0, -1)] =  ctx.value[0].image.slice(1,-1);
    }
}

var myHTMLXVisitorInstance = new HTMLXVisitor();

function generateAST(input) {
    var lexingResult = htmlxLexer.tokenize(input);
    parser.input = lexingResult.tokens;
    let cstOutput = parser.HTMLX();
    if(!cstOutput) {
        throw new Error(`Invalid input for parser: ${lexingResult.tokens.map(token => token.tokenType.name)}`);
    }
    let ast = myHTMLXVisitorInstance.visit(cstOutput);
    return ast;
}