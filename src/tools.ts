// This function simulates calling your SnapLogic REST API
export const callSnapLogicApi = async (functionName: string, args: any) => {
    const recentToolView = document.getElementById("recent-tool-view");
    //recentToolView?.replaceChildren(getLatestToolUI());
    getLatestToolUI();
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
    workshopToolsMetadata[openAIobject.function.name] = snaplogicToolObject;
    console.log(workshopToolsMetadata)
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
    const toolName = getMostRecentToolDetails().function.name;
    const toolData = workshopToolsMetadata[toolName];

    const recentToolNameField = document.getElementById("recent-tool-name") as HTMLParagraphElement;
    recentToolNameField.innerText = toolName;
    const recentToolParamsField = document.getElementById("recent-tool-params") as HTMLDivElement;
    recentToolParamsField.innerHTML = "";
    for (const param of toolData.parameters) {
        console.log(param);
        const paramElement = document.createElement("p");
        const paramNameText = param.name
        const requiredText = param.required ? "[MANDATORY]" : "[OPTIONAL]";
        const paramTypeText = `(${param.type.toUpperCase()})`;
        const paramFinalText = `${paramNameText} ${paramTypeText} ${requiredText}`;
        paramElement.innerText = paramFinalText;
        recentToolParamsField.appendChild(paramElement);
       // recentToolParamsField.appendChild(document.createElement("p").innerText = param.name)
    }

    const snaplogicUrlField = document.getElementById("recent-tool-snaplogic-url") as HTMLAnchorElement;
    snaplogicUrlField.href = pipelineUrls[toolName];
    
    // const textBox = document.createElement("div");
    // const tool = getMostRecentToolDetails();
    
    // if (tool.error) {
    //     textBox.innerText = tool.error;
    //     return textBox;
    // }

    // const paramsBox = getContainerWithText("Args:", JSON.stringify(tool.function.arguments));
    // const nameBox = getContainerWithText("Tool Name:", tool.function.name);
    // const descBox = getContainerWithText("Description:", tool.function.description);
    // textBox.appendChild(nameBox);
    // textBox.appendChild(descBox);
    // textBox.appendChild(paramsBox);

    // return textBox;
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

// const getWorkshopToolsMetadata = [
//     get{

//     }
// ]

const workshopToolsMetadata: any[] = [

]

const pipelineUrls: any = {
    "SubmitVerdict": "https://cdn.emea.snaplogic.com/sl/designer.html?v=26808#pipe_snode=68fe4d7679f6ef7772c53270",
    "SearchMeetingLogs" : "https://cdn.emea.snaplogic.com/sl/designer.html?v=26808#pipe_snode=6906b301cbcf6f467d869f70",
    "SearchEmployeeDatabase" : "https://cdn.emea.snaplogic.com/sl/designer.html?v=26808#pipe_snode=68e416511388a0230b784a37",
    "SearchFileSystem": "https://cdn.emea.snaplogic.com/sl/designer.html?v=26808#pipe_snode=68fe32d32a637a0a9ec6c999",
    "SearchProcessExecutions": "https://cdn.emea.snaplogic.com/sl/designer.html?v=26808#pipe_snode=68fcc9e9e4302e364975eabd",
    "SearchAccessLogs" : "https://cdn.emea.snaplogic.com/sl/designer.html?v=26808#pipe_snode=68f8db9cec51039867cb7740",
    "GetCaseFile": "https://cdn.emea.snaplogic.com/sl/designer.html?v=26808#pipe_snode=68e4138029c90dc77605ae4c"

}