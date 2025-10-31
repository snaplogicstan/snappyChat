// This function simulates calling your SnapLogic REST API
export const callSnapLogicApi = async (functionName: string, args: any) => {
    const recentToolView = document.getElementById("recent-tool-view");
    recentToolView?.replaceChildren(getLatestToolUI());
    console.log("Calling SnapLogic for:", functionName, "with args:", args);

    try {
        const response = await fetch(`https://emea.snaplogic.com/api/1/rest/slsched/feed/ConnectFasterInc/IGT_2025/Tools/${functionName}_APITask`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer 1234"
            },
            body: JSON.stringify(args)
        });

        if (!response.ok) {
            return { error: `HTTP error! status: ${response.statusText}` };
        }

        const data = await response.json();
        return data;
    } catch (error) {
        return { error: `Fetch error: ${error}` };
    }

    return { error: "Unknown function" };
}

export const getStandardToolDefinition = (snaplogicToolObject: any) => {
    const openAIobject: any = {
        type: "function",
        function: {
            name: snaplogicToolObject.name,
            description: snaplogicToolObject.description,
            parameters: {
                properties: {},
                required: []
            },

        }
    };
    for (const param of snaplogicToolObject.parameters) {
        if (param.required) {
            openAIobject.function.parameters.required.push(param.name);
        }
        openAIobject.function.parameters.type = "object";
        openAIobject.function.parameters.properties[param.name] = {
            type: param.type.toLowerCase(),
            description: param.description
        }
    }

    return openAIobject;
}

export const setMostRecentTool = (tool: any) => {
    localStorage.setItem("mostRecentTool", JSON.stringify(tool));
}


const getMostRecentToolDetails = () => {
    const tool = localStorage.getItem("mostRecentTool");
    
    if (!tool) {
        return {"error": "No tool found"};
    }

    return JSON.parse(tool);
}

export const getLatestToolUI = () => {
    const textBox = document.createElement("div");
    const tool = getMostRecentToolDetails();
    
    if (tool.error) {
        textBox.innerText = tool.error;
        return textBox;
    }

    const paramsBox = getContainerWithText("Args:", JSON.stringify(tool.function.arguments));
    const nameBox = getContainerWithText("Tool Name:", tool.function.name);
    const descBox = getContainerWithText("Description:", tool.function.description);
    textBox.appendChild(nameBox);
    textBox.appendChild(descBox);
    textBox.appendChild(paramsBox);

    return textBox;
}

const getContainerWithText = (label: string, text: string) => {
    const container = document.createElement("div");
    const labelElem = document.createElement("h3");
    labelElem.innerText = label;
    const textElem = document.createElement("p");
    textElem.innerText = text;

    container.appendChild(labelElem);
    container.appendChild(textElem);

    return container;
}

