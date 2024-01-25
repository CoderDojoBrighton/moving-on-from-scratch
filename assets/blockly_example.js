const thisScriptSrc = document.currentScript.src;

function getKeyOptions() {
    let keyOptions = [];
    keyOptions.push(['space', 'keys.SPACE']);
    keyOptions.push(['up arrow', 'keys.UP']);
    keyOptions.push(['down arrow', 'keys.DOWN']);
    keyOptions.push(['right arrow', 'keys.RIGHT']);
    keyOptions.push(['left arrow', 'keys.LEFT']);
    for (let key = 'a'.charCodeAt(0); key <= 'z'.charCodeAt(0); key++) {
        keyOptions.push([String.fromCharCode(key), 'keys.' + String.fromCharCode(key).toUpperCase()]);
    }
    for (let key = '0'.charCodeAt(0); key <= '9'.charCodeAt(0); key++) {
        keyOptions.push([String.fromCharCode(key), 'keys.K_' + String.fromCharCode(key).toUpperCase()]);
    }
    return keyOptions;
}

let pyodide = null;
let currentRunGlobals = null;
let currentRunPromise = null;
async function waitForPyodide() {
    if (pyodide !== null) {
        return pyodide;
    } else {
        pyodide = await loadPyodide({packages: ['pygame-ce', 'numpy', 'pgzero']});
        return pyodide;
    }
}

document.addEventListener("DOMContentLoaded", async function() {
    Blockly.Msg.HEADER_COLOUR = "#FFBF00";
    Blockly.Msg.MOTION_COLOUR = "#4C97FF";
    Blockly.Msg.CONTROL_COLOUR = "#FFAB19";
    Blockly.Msg.MATHS_COLOUR = "#59C059";

    Blockly.common.defineBlocksWithJsonArray([
        {
            'type': 'loop_forever',
            'message0': 'forever',
            'args0': [],
            'message1': '%1',
            'args1': [
                {
                    'type': 'input_statement',
                    'name': 'DO',
                },
            ],
            'previousStatement': null,
            "colour": "%{BKY_CONTROL_COLOUR}"
        },
        {
            "type": "on_key_pressed",
            "tooltip": "",
            "helpUrl": "",
            "message0": "when %1 key pressed",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "key",
                    "options": getKeyOptions()
                }
            ],
            "nextStatement": null,
            "colour": "%{BKY_HEADER_COLOUR}"
        },
        {
            "type": "on_start",
            "tooltip": "",
            "helpUrl": "",
            "message0": "when 🚩 clicked",
            "args0": [],
            "nextStatement": null,
            "colour": "%{BKY_HEADER_COLOUR}"
        },
        {
            "type": "change_x_by",
            "tooltip": "",
            "helpUrl": "",
            "message0": "change x by %1",
            "args0": [
                {
                    'type': 'input_value',
                    'name': 'value',
                    'check': 'Number',
                },
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "%{BKY_MOTION_COLOUR}"
        },
        {
            "type": "set_x_to",
            "tooltip": "",
            "helpUrl": "",
            "message0": "set x to %1",
            "args0": [
                {
                    'type': 'input_value',
                    'name': 'value',
                    'check': 'Number',
                },
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "%{BKY_MOTION_COLOUR}"
        },
        {
            "type": "change_y_by",
            "tooltip": "",
            "helpUrl": "",
            "message0": "change y by %1",
            "args0": [
                {
                    'type': 'input_value',
                    'name': 'value',
                    'check': 'Number',
                },
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "%{BKY_MOTION_COLOUR}"
        },
        {
            "type": "set_y_to",
            "tooltip": "",
            "helpUrl": "",
            "message0": "set y to %1",
            "args0": [
                {
                    'type': 'input_value',
                    'name': 'value',
                    'check': 'Number',
                },
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "%{BKY_MOTION_COLOUR}"
        }
    ]);

    Blockly.Blocks['touched_condition'] = {
        init: function () {
            this.jsonInit({
                "type": "touched_condition",
                "tooltip": "",
                "helpUrl": "",
                "message0": "touching %1?",
                "args0": [
                    {
                        "type": "field_dropdown",
                        "name": "sprite",
                        "options": this.workspace.spriteNames ? this.workspace.spriteNames.map(name => [name, name]) : [["unknown", "unknown"]]
                    }
                ],
                "output": "Boolean",
                "colour": 60
            });
        }
    };

    const theme = Blockly.Theme.defineTheme('blocklyDefaultWithHats', {
        'base': Blockly.Themes.Classic,
        'blockStyles': {},
        'categoryStyles': {},
        'componentStyles': {},
        'fontStyle': {},
        'startHats': true
    });

    python.pythonGenerator.forBlock['loop_forever'] = function (block, generator) {
        let branch = generator.statementToCode(block, 'DO');
        branch = generator.addLoopTrap(branch, block) || generator.PASS;
        return 'while True:\n' + branch;
    };

    python.pythonGenerator.forBlock['on_key_pressed'] = function (block, generator) {
        if (block.getNextBlock() == null) {
            return null;
        }

        const key = block.getFieldValue('key');
        let code = 'def on_key_down(key):\n' + generator.INDENT + `if key == ${key}:\n`;
        code += generator.prefixLines(generator.blockToCode(block.getNextBlock(), false), generator.INDENT.repeat(2));
        return code;
    };

    python.pythonGenerator.forBlock['touched_condition'] = function (block, generator) {
        const sprite = block.getFieldValue('sprite');
        return [block.workspace.currentSprite + ".colliderect(" + sprite + ")", 0];
    };

    python.pythonGenerator.forBlock['change_x_by'] = function (block, generator) {
        return `${block.workspace.currentSprite}.x += ${generator.valueToCode(block, 'value', python.Order.NONE)}\n`;
    };

    python.pythonGenerator.forBlock['set_x_to'] = function (block, generator) {
        return `${block.workspace.currentSprite}.x = ${generator.valueToCode(block, 'value', python.Order.NONE)}\n`;
    };

    python.pythonGenerator.forBlock['change_y_by'] = function (block, generator) {
        return `${block.workspace.currentSprite}.y += ${generator.valueToCode(block, 'value', python.Order.NONE)}\n`;
    };

    python.pythonGenerator.forBlock['set_y_to'] = function (block, generator) {
        return `${block.workspace.currentSprite}.y = ${generator.valueToCode(block, 'value', python.Order.NONE)}\n`;
    };

    const originalScrub = python.pythonGenerator.scrub_;
    python.pythonGenerator.scrub_ = function (block, code, thisOnly) {
        if (block.type === "on_key_pressed") {
            return code;
        }

        return originalScrub.call(python.pythonGenerator, block, code, thisOnly);
    };

    for (const blocklyContainer of document.getElementsByClassName("blocklyContainer")) {
        const spritesRow = blocklyContainer.getElementsByClassName("spritesRow")[0];
        const blocklyElement = blocklyContainer.getElementsByClassName("blocklyDiv")[0];
        const codeElement = blocklyContainer.getElementsByClassName("codeDiv")[0];
        const canvasElement = blocklyContainer.getElementsByClassName("pygameCanvas")[0];

        const runButton = blocklyContainer.getElementsByClassName("runButton")[0];

        let clickEventHandlerInstanceCount = 0;
        runButton.addEventListener("click", async function() {
            if (clickEventHandlerInstanceCount > 1) {
                // Allow for one running instance and one prepared to take over but no more than that.
                console.warn("There are already", clickEventHandlerInstanceCount, "instances running!");
                return;
            }

            clickEventHandlerInstanceCount++;
            for (const image of spritesRow.childNodes) {
                await PyGameRunner.preloadImage(image.childNodes[0].src);
            }
            await PyGameRunner.run(canvasElement, generateCode());
            clickEventHandlerInstanceCount--;
        });

        let spriteWorkspaces = {
            "__builtin__": {
                blocks: {
                    languageVersion: 0,
                    blocks: []
                }
            }
        };

        const workspace = Blockly.inject(blocklyElement, {
            media: new URL("blockly/media/", thisScriptSrc).toString(),
            theme: theme,
            renderer: 'zelos',
            toolbox: blocklyElement.dataset.readonly === 'true' ? undefined : {
                kind: 'flyoutToolbox',
                contents: [
                    {
                        kind: 'block',
                        type: 'controls_if'
                    },
                    {
                        kind: 'block',
                        type: 'loop_forever'
                    },
                    {
                        kind: 'block',
                        type: 'on_key_pressed'
                    },
                    {
                        kind: 'block',
                        type: 'on_start'
                    },
                    {
                        kind: 'block',
                        type: 'touched_condition'
                    },
                    {
                        kind: 'block',
                        type: 'change_x_by',
                        inputs: {
                            value: {
                                shadow: {
                                    type: 'math_number',
                                    fields: {NUM: 0}
                                }
                            }
                        }
                    },
                    {
                        kind: 'block',
                        type: 'set_x_to',
                        inputs: {
                            value: {
                                shadow: {
                                    type: 'math_number',
                                    fields: {NUM: 0}
                                }
                            }
                        }
                    },
                    {
                        kind: 'block',
                        type: 'change_y_by',
                        inputs: {
                            value: {
                                shadow: {
                                    type: 'math_number',
                                    fields: {NUM: 0}
                                }
                            }
                        }
                    },
                    {
                        kind: 'block',
                        type: 'set_y_to',
                        inputs: {
                            value: {
                                shadow: {
                                    type: 'math_number',
                                    fields: {NUM: 0}
                                }
                            }
                        }
                    }
                ]
            },
            oneBasedIndex: false
        });
        // Yes, we're hot-patching blockly here. No, it's not great. Still, it works. JavaScript has its good points.
        workspace.currentSprite = "__builtin__";
        workspace.spriteNames = [];

        workspace.configureContextMenu = function (menuOptions, e) {
            const item = {
                text: 'Copy workspace',
                enabled: true,
                callback: function () {
                    spriteWorkspaces[workspace.currentSprite] = Blockly.serialization.workspaces.save(workspace);
                    navigator.clipboard.writeText(JSON.stringify({
                        "sprites": Object.keys(spriteWorkspaces).map(key => {
                            return {
                                name: key,
                                image: key + ".png",
                                workspace: spriteWorkspaces[key]
                            };
                        })
                    }, null, 2));
                },
            };
            // Add the item to the end of the context menu.
            menuOptions.push(item);
        };

        function reloadWorkspace() {
            Blockly.serialization.workspaces.load(spriteWorkspaces[workspace.currentSprite], workspace);
            if (blocklyElement.dataset.readonly !== 'true') {
                for (let block of workspace.getAllBlocks()) {
                    block.setDeletable(false);
                }
            }
        }

        if (blocklyElement.dataset.sample !== undefined && blocklyElement.dataset.sample !== "") {
            await fetch(blocklyElement.dataset.sample)
                .then(result => result.json())
                .then(async result => {
                    if (result.sprites !== undefined) {
                        for (const sprite of result.sprites) {
                            const spriteButton = document.createElement("button");
                            spriteButton.addEventListener('click', function () {
                                spriteWorkspaces[workspace.currentSprite] = Blockly.serialization.workspaces.save(workspace);
                                workspace.currentSprite = sprite.name;
                                reloadWorkspace();
                            });
                            const spriteImage = document.createElement("img");
                            if (blocklyElement.dataset.sample.startsWith('/')) {
                                spriteImage.src = new URL(sprite.image, window.origin + blocklyElement.dataset.sample).toString();
                            } else {
                                spriteImage.src = new URL(sprite.image, blocklyElement.dataset.sample).toString();
                            }
                            spriteButton.appendChild(spriteImage);

                            const spriteNameLabel = document.createElement("legend");
                            spriteNameLabel.textContent = sprite.name;
                            spriteButton.appendChild(spriteNameLabel);
                            spritesRow.appendChild(spriteButton);

                            if (sprite.workspace !== undefined) {
                                spriteWorkspaces[sprite.name] = sprite.workspace;
                            } else {
                                spriteWorkspaces[sprite.name] = {
                                    blocks: {
                                        languageVersion: 0,
                                        blocks: []
                                    }
                                };
                            }
                            workspace.spriteNames.push(sprite.name);
                        }
                        workspace.currentSprite = result.sprites[0].name;
                        delete spriteWorkspaces["__builtin__"];
                    }
                });
        }

        reloadWorkspace();

        const supportedEvents = new Set([
            Blockly.Events.BLOCK_CHANGE,
            Blockly.Events.BLOCK_CREATE,
            Blockly.Events.BLOCK_DELETE,
            Blockly.Events.BLOCK_MOVE,
        ]);

        function generateCode() {
            let global_blocks = [];
            let update_handlers = [];
            let key_pressed_handlers = {};

            python.pythonGenerator.init(workspace);
            for (const block of workspace.getTopBlocks(true)) {
                switch (block.type) {
                    case 'on_start': {
                        const nextBlock = block.getNextBlock();
                        if (nextBlock !== null) {
                            if (nextBlock.type === "loop_forever") {
                                const targetBlock = nextBlock.getInputTargetBlock("DO");
                                if (targetBlock !== null) {
                                    update_handlers.push(python.pythonGenerator.blockToCode(targetBlock));
                                }
                            } else {
                                global_blocks.push(python.pythonGenerator.blockToCode(nextBlock));
                            }
                        }
                        break;
                    }
                    case 'on_key_pressed': {
                        const nextBlock = block.getNextBlock();
                        if (nextBlock !== null) {
                            key_pressed_handlers[block.getFieldValue("key")] = python.pythonGenerator.blockToCode(nextBlock);
                        }
                        break;
                    }
                    default: {
                        global_blocks.push(python.pythonGenerator.blockToCode(block));
                    }
                }
            }

            let code = "WIDTH = 800\nHEIGHT = 600\n\n";
            for (const sprite of workspace.spriteNames) {
                code += `${sprite} = Actor('${sprite}')\n`;
            }
            code += '\n';
            for (const globalBlock of global_blocks) {
                code += globalBlock + "\n";
            }
            if (update_handlers.length > 0) {
                code += "def update():\n"
                for (const updateHandler of update_handlers) {
                    code += "  " + updateHandler.trim().replaceAll("\n", "\n  ") + "\n";
                }
                code += "\n";
            } else {
                code += "def update():\n  pass\n";
            }
            if (workspace.spriteNames.length > 0) {
                code += "def draw():\n  screen.fill((0, 0, 0))\n";
                for (const sprite of workspace.spriteNames) {
                    code += `  ${sprite}.draw()\n`;
                }
                code += "\n";
            } else {
                code += "def draw():\n  pass\n";
            }
            if (Object.keys(key_pressed_handlers).length > 0) {
                code += "def on_key_down(key):\n"
                for (const key of Object.keys(key_pressed_handlers)) {
                    code += `  if key == ${key}:\n    ` + key_pressed_handlers[key].trim().replaceAll("\n", "\n    ") + "\n";
                }
            }
            return code;
        }

        function updateCode(event) {
            if (workspace.isDragging()) return; // Don't update while changes are happening.
            if (!supportedEvents.has(event.type)) return;

            codeElement.innerHTML = generateCode();
            codeElement.dataset.highlighted = '';
            hljs.highlightElement(codeElement);
        }

        workspace.addChangeListener(updateCode);
        updateCode(Blockly.Events.BLOCK_CREATE);
    }
});