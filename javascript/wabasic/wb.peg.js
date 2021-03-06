{
    // ###### begin 辅助函数

    // 外部定义的话优先使用外部定义
    var println = window.println || function (d) { console.log(d) };

    /**
     * 工具方法：构建顺序语句列表使用
     * extractList([[1,2], [2, 3], [4,5]], 1) => [2, 3, 5]
     */
    function extractList(list, index) {
        return list.map(function (element) { return element[index]; });
    }

    /**
     * 工具方法：构建顺序语句列表使用
     * buildList(100, [[1,2], [3,4],[5,6]], 1) => [100, 2, 4, 6]
     */
    function buildList(head, tail, index) {
        return [head].concat(extractList(tail, index));
    }

    /**
     * 抛出语法或语义错误 
     */
    function throwError(msg) {
        console.error(msg);
        throw msg;
    }

    // ###### begin 全局函数

    /**
     * 创建数组
     */
    window.mkarr = function() {
        return Array.prototype.slice.call(arguments)
    }

    /**
     * 数组末尾追加元素
     */
    window.arrpush = function (arr, o) {
        arr.push(o);
    }

    /**
     * 获取数组元素
     */
    window.arrget = function (arr, i) {
        return arr[i];
    }

    /**
     * 设置数组元素
     */
    window.arrset = function(arr, i, o) {
        arr[i] = o;
    }

    /**
     * 获取数组长度
     */
    window.len = function (arr) {
        return arr.length;
    }

    /**
     * 创建对象
     */
    window.mkobj = function () {
        var args = Array.prototype.slice.call(arguments);
        var ret = {};
        for (var i = 0; i < args.length; i = i + 2) {
            ret[args[i]] = args[i + 1];            
        }
        return ret;
    }

    /**
     * 获取对象属性值
     */
    window.itemget = function (obj, key) {
        return obj[key];
    }

    /**
     * 设置对象属性值
     */
    window.itemset = function (obj, key, value) {
        obj[key] = value;
    }

    /**
     * 获取对象属性列表
     */
    window.keys = function (obj) {
        return Object.keys(obj).sort();        
    }

    // ###### begin 构建 AST    

    /**
     * 整形数字
     * @param {数字} n 
     */
    function Integer(n) {
        this.type = 'Integer';
        this.n = n;
        Integer.prototype.eval = function (env) { return parseInt(this.n, 10); }
    }

    function StringLiteral(str) {
        this.type = 'StringLiteral';
        this.str = str;
        StringLiteral.prototype.eval = function (env) { return this.str; }        
    }

    /**
     * 标识符
     * @param {名称} id 
     */
    function Id(id) {
        this.type = 'Id';
        this.id = id;
        Id.prototype.eval = function (env) { return env[this.id]; }
    }

    /**
     * 二元操作符
     * @param {left} left 
     * @param {op} op 
     * @param {right} right 
     */
    function BinOpExp(left, op, right) {
        this.type = 'BinOpExp';
        this.op = op;
        this.left = left;
        this.right = right;
        BinOpExp.prototype.eval = function (env) {
            console.log('BinOpExp#eval', this.left, this.op, this.right);
            console.log('BinOpExp#eval', this.left.eval(env), this.op, this.right.eval(env));
            switch (this.op) {
                case '+': return this.left.eval(env) + this.right.eval(env);
                case '-': return this.left.eval(env) - this.right.eval(env);
                case '*': return this.left.eval(env) * this.right.eval(env);
                case '/': return this.left.eval(env) / this.right.eval(env);
                case '%': return this.left.eval(env) % this.right.eval(env);
                case '<': return this.left.eval(env) < this.right.eval(env);
                case '>': return this.left.eval(env) > this.right.eval(env);
                case '<=': return this.left.eval(env) <= this.right.eval(env);
                case '>=': return this.left.eval(env) >= this.right.eval(env);
                case '==': return this.left.eval(env) == this.right.eval(env);
                case '!=': return this.left.eval(env) != this.right.eval(env);
                case 'and': return this.left.eval(env) && this.right.eval(env);
                case 'or': return this.left.eval(env) || this.right.eval(env);
                default:
                    console.log('Unknow op:' + this.op)
                    throw 'Unknow op:' + this.op;
            }
        }
    }  

    /**
     * 赋值语句
     * @param {变量名} id 
     * @param {表达式} exp 
     */
    function AssignStat(id, exp) {
        this.type = 'assignStat';
        this.id = id;
        this.exp = exp;
        AssignStat.prototype.eval = function (env) {
            console.log('AssignStat#eval' + this.id.id, env);
            env[this.id.id] = this.exp.eval(env);
        }
    }

    /**
     * 内置 print 函数
     */
    var PrintFunc = {
        type: 'func',
        params: 'o',
        eval: function (env) {
            console.log('PrintFunc#eval', env);
            println(env['o']);
        }
    };

    /**
     * 函数定义语句
     * @param {函数名} name 
     * @param {形参列表} params 
     * @param {函数体} body 
     */
    function DefStat(name, params, body) {
        this.type = 'def';
        this.name = name;
        this.params = params;
        this.body = body;
        DefStat.prototype.eval = function (env) {
            console.log('DefStat#eval', env, this.params);
            var that = this;
            env[this.name.id] = {
                // 实现闭包：捕获变量
                capture: Object.assign({}, env),
                type: 'func',
                params: this.params,
                eval: function (env) {
                    console.log('Func#eval' + that.name.id, env);
                    that.body.eval(env);
                    // 实现闭包：返回修改后的环境
                    return env;
                }
            };
        }
    }



    /**
     * return 语句使用 throw 实现，这里封装要 throw 的对象
     * @param {返回的对象} ret 
     */
    function ReturnObject(ret) {
        this.type = 'ReturnObject'
        this.ret = ret;
    }

    /**
     * return 语句，使用 throw 实现
     * @param {返回的表达式} exp 
     */
    function ReturnStat(exp) {
        this.type = 'ReturnStat';
        this.exp = exp;
        ReturnStat.prototype.eval = function (env) {
            console.log('ReturnStat:eval', env, exp);
            throw new ReturnObject(this.exp.eval(env));
        }
    }

    /**
     * 函数调用表达式
     * @param {要调用的函数名} name 
     * @param {实参列表} args 
     */
    function CallExp(name, args) {
        this.type = 'call';
        this.name = name;
        this.args = args;
        CallExp.prototype.eval = function (env) {
            console.log('CallExp:eval before:', this.name.id, env);

            var func = env[this.name.id];


            if (!func) {
                // 调用原生 js 函数，不需要构建 env 和 闭包捕获的变量，只传参数
                if (typeof window[this.name.id] === 'function') {
                    var args = [];
                    for (var i = 0; i < this.args.length; i++) {
                        args.push(this.args[i].eval(env));
                    }                    
                    return window[this.name.id].apply(null, args)
                }
            
                throwError('Unknow func:' + this.name.id);
            }

            if (func.type != 'func') {
                throwError('Id is not func:' + this.name.id);
            }

            // 形参和实参个数校验
            if (this.args.length != func.params.length) {
                throwError('args length error:' + func.params.length + ', ' + this.args.length);
            }

            console.debug('CallExp:capture, env', this.name.id, func.capture, env);
            // 实现闭包：合并定义期间捕获的变量
            env = Object.assign(func.capture || {}, env);

            // 构建实参
            for (var i = 0; i < func.params.length; i++) {
                env[func.params[i]] = this.args[i].eval(env);
            }

            try {
                // 再次拷贝，防止递归调用时外层函数的变量被内层函数改动
                var modifyenv = func.eval(Object.assign({}, env));
                // 实现闭包：修改捕获的变量            
                var keys = Object.keys(func.capture || {});
                for (var i = 0; i < keys.length; i++) {
                    var key = keys[i];
                    func.capture[key] = modifyenv[key];
                }
            } catch (err) {
                // 使用 thorw 实现 return 语句
                if (err instanceof ReturnObject) {
                    return err.ret;
                }
                throw err;

            }
            console.log('CallExp:eval after:', this.name.id, env);
        }
    }


    /**
     * 顺序语句
     * @param {语句列表} body 
     */
    function SeqStat(body) {
        this.type = 'SeqStat';
        this.body = body;
        SeqStat.prototype.eval = function (env) {
            console.log('SeqStat:env', env);
            if (this.body.length) {
                for (var i = 0, len = this.body.length; i < len; i++) {
                    this.body[i].eval(env);
                }
            }
        }
    }

    /**
     * 循环语句：while
     * @param {条件} cond 
     * @param {主体} body 
     */
    function WhileStat(cond, body) {
        this.type = 'WhileStat';
        this.cond = cond;
        this.body = body;
        WhileStat.prototype.eval = function (env) {
            while (this.cond.eval(env)) {
                this.body.eval(env);
            }
        }
    }
    
    /**
     * for .. to 循环
     * @param {变量} id 
     * @param {起始点} begin 
     * @param {结束点} end 
     * @param {循环语句} body 
     */
    function ForToStat(id, begin, end, body) {
        this.id = id;
        this.begin = begin;
        this.end = end;
        this.body = body;

        ForToStat.prototype.eval = function (env) {
            var begin = this.begin.eval(env);
            var end = this.end.eval(env);
            if (begin > end) {
                throwError("begin > end");
            }
            for (var i = begin; i <= end; i++) {              
                env[this.id.id] = i;
                this.body.eval(env);
            }
        }
    }

    /**
     * 分支语句：if
     * @param {条件} cond 
     * @param {主体} body 
     */
    function IfStat(cond, body, elseBody) {
        this.type = 'IfStat';
        this.cond = cond;
        this.body = body;
        this.elseBody = elseBody;
        IfStat.prototype.eval = function (env) {
            if (this.cond.eval(env)) {
                this.body.eval(env);
            } else {
                if (elseBody != null) {
                    elseBody.eval(env);
                }
            }
        }
    }

    /**
     * 程序入口
     * @param {主体} body 
     */
    function Program(body) {
        this.type = 'Program';
        this.body = body;
        Program.prototype.eval = function () {
            var env = {};
            env['print'] = PrintFunc;
            if (this.body) {
                this.body.eval(env);
            }
        }
    }   
}

Start  = __ body:SourceElements? __ { 	
	return new Program(body);
}

SourceElements
  = head:Statement tail:(__ Statement)* {
  		var body = buildList(head, tail, 1);
  		return new SeqStat(body);      
    }

// ###### begin 词法解析

WhiteSpace "whitespace" = [\t ]
LineTerminator = [\n\r]
LineTerminatorSequence "end of line"  = "\n"  / "\r\n"  / "\r"
__  = (WhiteSpace / LineTerminatorSequence / Comment)*
_  = (WhiteSpace)*
EOF = !. 
EOS  = __ ";" / _ Comment? LineTerminatorSequence   / __ EOF  
Comment  = ['#] (!LineTerminator .)* 
Integer "integer"  = _ [0-9]+ { return new Integer(text()); }
Id = !Keyword ([a-z]+ [0-9]* [z-z]*)  { return new Id(text())}
Keyword  = 'if' / 'then'  / 'end'  / 'while' / 'and' / 'or' / 'for' /'to'/ 'def' / 'return'
DoubleStringCharacter
  = !('"' / "\\" / LineTerminator) . { return text(); }
StringLiteral  = '"' chars:DoubleStringCharacter* '"' { return new StringLiteral(chars.join("")) }
 


// ###### begin 表达式解析
// 注意，优先级要从低到高依次声明：或 < 与 < 关系运算符 < 加减 < 乘除 < (括号|数字|标识符|函数调用)
Exp
	= exp:OrExp { return exp }

OrExp
  = head:AndExp tail:(_ ( "or") _ AndExp)* _ {
      return tail.reduce(function(result, element) {
		return new BinOpExp(result, element[1], element[3])
      }, head);
    }
    
AndExp
  = head:RelExp tail:(_ ("and") _ RelExp)*  _ {
      return tail.reduce(function(result, element) {
      	return new BinOpExp(result, element[1], element[3])
      }, head);
    }    
  
RelExp
  = head:MathExp tail:(_ ("<=" / "<>"  / ">=" / "<" / ">" / "==" / "!=" ) _ MathExp)*  _{
      return tail.reduce(function(result, element) {
      	return new BinOpExp(result, element[1], element[3])
      }, head);
    }    
    
MathExp
  = head:Term tail:(_ ( "+" / "-"  ) _ Term)* _ {
      return tail.reduce(function(result, element) {      	
        return new BinOpExp(result, element[1], element[3])
      }, head);
    }

Term
  = head:Factor tail:(_ ("*" / "/" / "%") _ Factor)* {
      return tail.reduce(function(result, element) {
		return new BinOpExp(result, element[1], element[3])
      }, head);
    }

CallExp
    =  _ name:Id  '(' _ args:ArgList _ ')' { return new CallExp(name, args)  } 
    / _ name:Id  WhiteSpace+ args:ArgList _ { return new CallExp(name, args)  } 
    / _ name:Id '(' _')' { return new CallExp(name, []) }
      

ArgList
    = head:Exp _ ',' _ tail:ArgList { tail.unshift(head);return tail;}
    / exp:Exp { return [exp]}      

// 注意：CallExp 要在 Id 上面，因为CallExp 是 id 后加括号
Factor
  = "(" _ expr:MathExp _ ")" { return expr; }
  / CallExp
  / Integer
  / Id  
  / StringLiteral

// ###### begin 语句解析
    
Statement
  = AssignStat
  / PrintStat
  / IfStat
  / WhileStat  
  / DefStat
  / CallStat
  / ReturnStat
  / ForToStat
    
AssignStat
	= id:Id _ '=' _ exp:Exp EOS { return new AssignStat(id, exp); }
    
PrintStat
	=  'print' ' '+ exp:Exp { return new CallExp(new Id('print'), [exp]) } 

ReturnStat
	=  'return' _ exp:Exp { return new ReturnStat(exp) }     
    
IfStat
	= 'if' _ cond:Exp _ 'then' EOS
    __ body:(SourceElements?) __
    elsePart:ElsePart?
    'end'  EOS { return new IfStat(cond, body, elsePart)}

ElsePart
    = 'else' EOS 
    __ body:(SourceElements?) __ { return body}

WhileStat
	= 'while' _ cond:Exp EOS
    __ body:(SourceElements?) __
    'end'  EOS { return new WhileStat(cond, body)  }  

ForToStat
    = 'for' _ id:Id _ '=' _ begin:Exp _ 'to' _ end:Exp EOS
    __ body:(SourceElements?) __
    'end' EOS { return new ForToStat(id, begin, end, body);}

DefStat
	= 'def'i _ name:Id '(' _ params:ParamList _ ')' EOS
    __ body:(SourceElements?) __
    'end'i  EOS { return new DefStat(name, params, body)  }  

ParamList
    = head:Id _ ',' _ tail:ParamList { tail.unshift(head.id);return tail;}
    / id:Id { return [id.id]}  
    / _ {return []}

// 函数调用既是表达式又是语句
CallStat
    = CallExp
              