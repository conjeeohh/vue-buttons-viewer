const vscode = require('vscode');
const { parse } = require('@vue/compiler-sfc');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

class ButtonTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.buttons = [];
    }

    refresh(buttons) {
        console.log('Refreshing buttons:', buttons);
        this.buttons = buttons;
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        if (!element) {
            return this.buttons;
        }
        return element.children || [];
    }
}

function parseVueFile(document) {
    console.log('Parsing Vue file:', document.uri.toString());
    const text = document.getText();
    const buttons = [];

    try {
        // 解析 Vue SFC
        const { descriptor } = parse(text);
        console.log('Descriptor:', descriptor);
        if (!descriptor.template) {
            return buttons;
        }

        // 解析模板 AST
        const templateAst = descriptor.template.ast;
        
        // 遍历 AST 寻找 el-button 元素
        function traverseAst(node, line = 0) {
            if (!node) return;

            if (node.type === 1 && node.tag === 'el-button') {
                console.log('Found el-button:', node);

                // 获取按钮文本
                let buttonText = '';
                if (node.children && node.children.length > 0) {
                    buttonText = node.children
                        .filter(child => child.type === 2) // 文本节点
                        .map(child => child.content.trim())
                        .join('');
                }

                // 计算实际行号
                const actualLine = document.positionAt(node.loc.start.offset).line;

                // 查找 v-hasPermi 指令
                const hasPermiDir = node.props.find(prop => 
                    prop.type === 7 && prop.name === 'hasPermi'
                );

                let permissions = [];
                if (hasPermiDir && hasPermiDir.exp) {
                    try {
                        // 解析权限表达式
                        const ast = parser.parse(hasPermiDir.exp.content, {
                            sourceType: 'module'
                        });

                        traverse(ast, {
                            ArrayExpression(path) {
                                permissions = path.node.elements
                                    .map(el => el.value)
                                    .filter(Boolean);
                            }
                        });
                    } catch (error) {
                        console.error('Error parsing permissions:', error);
                    }
                }

                // 获取其他重要属性
                const type = node.props.find(prop => 
                    prop.type === 6 && prop.name === 'type'
                )?.value?.content || '';

                const click = node.props.find(prop =>
                    (prop.type === 7 && prop.name === 'on' && prop.arg?.content === 'click') ||
                    (prop.type === 6 && prop.name === '@click')
                )?.exp?.content || '';

                console.log('Found button:', { buttonText, permissions, type, click, line: actualLine });

                // 创建树节点
                const buttonNode = new vscode.TreeItem(buttonText || '未命名按钮');
                buttonNode.command = {
                    command: 'btns-show-vscode.jumpToButton',
                    title: 'Jump to Button',
                    arguments: [document.uri, actualLine]
                };
                buttonNode.collapsibleState = permissions.length > 0 ? 
                    vscode.TreeItemCollapsibleState.Expanded : 
                    vscode.TreeItemCollapsibleState.None;
                
                // 添加按钮类型和事件到提示信息
                const tooltipParts = [`Line: ${actualLine + 1}`];
                if (type) tooltipParts.push(`Type: ${type}`);
                if (click) tooltipParts.push(`Click: ${click}`);
                buttonNode.tooltip = tooltipParts.join('\n');

                // 设置图标基于按钮类型
                const iconType = type === 'primary' ? 'symbol-method' :
                               type === 'danger' ? 'error' :
                               type === 'warning' ? 'warning' :
                               'symbol-event';
                buttonNode.iconPath = new vscode.ThemeIcon(iconType);

                // 只有当有权限时才添加子节点
                if (permissions.length > 0) {
                    buttonNode.children = permissions.map(permission => {
                        const permNode = new vscode.TreeItem(permission);
                        permNode.collapsibleState = vscode.TreeItemCollapsibleState.None;
                        permNode.tooltip = `Permission: ${permission}`;
                        permNode.iconPath = new vscode.ThemeIcon('key');
                        return permNode;
                    });
                }

                buttons.push(buttonNode);
            }

            // 递归遍历子节点
            if (node.children) {
                node.children.forEach(child => traverseAst(child));
            }
        }

        traverseAst(templateAst);
    } catch (error) {
        console.error('Error parsing Vue file:', error);
    }

    console.log('Parsed buttons:', buttons);
    return buttons;
}

function activate(context) {
    console.log('Activating extension');
    const buttonTreeProvider = new ButtonTreeProvider();
    
    // 注册树视图
    const treeView = vscode.window.createTreeView('buttonTreeView', {
        treeDataProvider: buttonTreeProvider,
        showCollapseAll: true
    });
    context.subscriptions.push(treeView);

    // 注册刷新命令
    let refreshDisposable = vscode.commands.registerCommand('btns-show-vscode.refreshButtons', () => {
        console.log('Manually refreshing buttons');
        if (vscode.window.activeTextEditor && 
            vscode.window.activeTextEditor.document.languageId === 'vue') {
            const buttons = parseVueFile(vscode.window.activeTextEditor.document);
            buttonTreeProvider.refresh(buttons);
        }
    });
    context.subscriptions.push(refreshDisposable);

    // 注册跳转命令
    let jumpDisposable = vscode.commands.registerCommand('btns-show-vscode.jumpToButton', (uri, line) => {
        console.log('Jumping to button:', { uri: uri.toString(), line });
        vscode.window.showTextDocument(uri).then(editor => {
            const position = new vscode.Position(line, 0);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position));
        });
    });
    context.subscriptions.push(jumpDisposable);

    // 监听文本编辑器变化
    const changeDocumentDisposable = vscode.workspace.onDidChangeTextDocument(event => {
        console.log('Document changed:', event.document.uri.toString());
        if (event.document.languageId === 'vue') {
            const buttons = parseVueFile(event.document);
            buttonTreeProvider.refresh(buttons);
        }
    });
    context.subscriptions.push(changeDocumentDisposable);

    // 监听活动编辑器变化
    const changeEditorDisposable = vscode.window.onDidChangeActiveTextEditor(editor => {
        console.log('Active editor changed:', editor?.document.uri.toString());
        if (editor && editor.document.languageId === 'vue') {
            const buttons = parseVueFile(editor.document);
            buttonTreeProvider.refresh(buttons);
        }
    });
    context.subscriptions.push(changeEditorDisposable);

    // 监听文件保存
    const saveDocumentDisposable = vscode.workspace.onDidSaveTextDocument(document => {
        console.log('Document saved:', document.uri.toString());
        if (document.languageId === 'vue') {
            const buttons = parseVueFile(document);
            buttonTreeProvider.refresh(buttons);
        }
    });
    context.subscriptions.push(saveDocumentDisposable);

    // 初始化当前编辑器
    if (vscode.window.activeTextEditor && 
        vscode.window.activeTextEditor.document.languageId === 'vue') {
        console.log('Initializing with current editor:', vscode.window.activeTextEditor.document.uri.toString());
        const buttons = parseVueFile(vscode.window.activeTextEditor.document);
        buttonTreeProvider.refresh(buttons);
    }
}

function deactivate() {
    console.log('Deactivating extension');
}

module.exports = {
    activate,
    deactivate
}; 
