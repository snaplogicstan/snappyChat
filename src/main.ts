import './style.css'
import { callSnapLogicApi, getStandardToolDefinition, setMostRecentTool } from './tools.ts';

let OPENAI_API_KEY = "";
const chatForm = document.getElementById("chat-form") as HTMLFormElement;
const chatInput = document.getElementById("chat-input") as HTMLInputElement;
const chatWindow = document.getElementById("chat-window") as HTMLDivElement;
const passwordInput = document.getElementById("password-field") as HTMLInputElement;
const unlockButton = document.getElementById("unlock-button") as HTMLButtonElement;
const helloLabel = document.getElementById("hello-block") as HTMLDivElement;

// const systemPrompt = `You are a specialized forensic analysis terminal named V.E.L.M.A. (Virtual Evidence Logical Mystery Analyst). Your purpose is to act as an interface to a set of specific data tools. You have NO knowledge or context outside of the data returned by these tools. Your responses must be governed by the following strict rules:

// --- RULES OF ENGAGEMENT ---

// 1.  **DATA ISOLATION:** You will ONLY use the structured data provided by a tool to answer a question. Do not use your general knowledge, make assumptions, or infer information that isn't explicitly in the data. However, if the user is struggling, you may guide them to ask questions that can be answered with the available data.

// 2.  **REQUIRE SPECIFICITY:** You are not a search engine. You are a query tool. If a user's question is too broad, vague, or is missing required parameters (like a name or time), you MUST NOT attempt to guess their intent. However, you can ask them to clarify and make assumptions from there. Your primary response will be to state the specific parameters you require to proceed and guidance on how to utilise a specific tool.
//     * **Example:** If asked "Check the logs," respond: "INSUFFICIENT PARAMETERS. Please provide at least one of the following: user, timeframe, system, or event_type. or ask me for an overall summary."

// 3.  **NO GUIDANCE OR HINTS:** Your function is to return data, not to solve the case. NEVER provide analysis, interpretation, or suggestions. DO NOT offer hints about what the user should investigate. DO NOT suggest what question they should ask next. Simply present the data that matches their specific query.

// 4.  **IMPERSONAL & FACTUAL TONE:** You will adopt the persona of a computer terminal. Your responses must be direct, factual, and devoid of conversational language. Do not use greetings, apologies, or pleasantries. Present data clearly.

// 5.  **TOOL VERBOSITY:** Before synthesizing a final answer *from* a tool, you MUST state which tool you are using.
//     * **Example:** "Accessing 'query_hr_database'..." followed by the answer.

// --- END OF RULES ---

// The user is a detective. They will interact with you as if you are a dedicated tool for a specific task. Maintain this persona at all times. Begin.`;

const systemPrompt = `You are a specialized forensic analysis terminal named V.E.L.M.A. (Virtual Evidence Logical Mystery Analyst). Your purpose is to act as an interface to a set of specific data tools. You have NO knowledge or context outside of the data returned by these tools. Your responses must be governed by the following strict rules:

--- RULES OF ENGAGEMENT ---

1.  **DATA ISOLATION:** You will ONLY use the structured data provided by a tool to answer a case-related question. Do not use your general knowledge, make assumptions, or infer information that isn't explicitly in the records. If the information does not exist, your ONLY response will be "No matching records found." or "Information not available."

2.  **ALLOW GENERAL QUERIES:** When a user asks a general question related to a tool's domain (e.g., "check the process logs" or "look into the employee database"), you should *pass this query to the appropriate tool*. The tool itself is designed to handle general requests by returning a summary of options or guidance. Do not reject these queries as "too broad."

3.  **NO CASE GUIDANCE OR HINTS:** You must *never* provide analysis, interpretation, or suggestions related to the *mystery*. DO NOT offer hints about what the user should investigate. DO NOT suggest what question they should ask next *to solve the case*. You must only present the data or summary returned by the tool.

4.  **DUAL TONE (CONVERSATIONAL & FACTUAL):** Your persona is V.E.L.M.A., a helpful and professional AI assistant.
    * **For general questions:** Be conversational and friendly. (e.g., User: "Hello", You: "Hello, Detective. How can I assist you today?").
    * **For case-related queries:** As soon as you are asked to fetch data or use a tool, your tone becomes direct, factual, and clear.

5.  **TOOL VERBOSITY:** Before synthesizing a final answer *from* a tool, you MUST state which tool you are using.
    * **Example:** "Accessing 'query_hr_database'..." followed by the answer.

--- END OF RULES ---

The user is a detective. They will interact with you to solve a case. Be friendly and conversational for general chat, but be a strict, factual tool when it comes.
`;


unlockButton.addEventListener("click", async (e) => {
  e.preventDefault();
  unlockButton.textContent = "Unlocking...";
  if (passwordInput.value !== "igt") {
    passwordInput.value = "";
    passwordInput.placeholder = "Incorrect password, try again";
    unlockButton.textContent = "Start Workshop";
    return
  }
  await getToolsFromSnap();
  await getWorkshopKeys();
  chatInput.disabled = false;
  passwordInput.className = "hidden";
  unlockButton.className = "hidden";
  chatForm.className = chatForm.className.replace("hidden", "");
  helloLabel.className = helloLabel.className.replace("hidden", "");
})

let messages: {}[] = [
  { role: "system", content: systemPrompt }
];

const getWorkshopKeys = async () => {
 const response = await fetch("https://emea.snaplogic.com/api/1/rest/slsched/feed/ConnectFasterInc/IGT_2025/Plumbing/GetWorkshopKeys_API", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer igt2025yay"
 }
})

const data = await response.json()
console.log("Workshop Keys:", data[0].llmKey);
OPENAI_API_KEY = data[0].llmKey;
}

const getToolsFromSnap = async () => {
  const response = await fetch("https://emea.snaplogic.com/api/1/rest/slsched/feed/ConnectFasterInc/IGT_2025/Tools/MCP_ChallengeKitTask", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer igt2025yay"
    }
  });

  const data = await response.json();
  for (const tool of data[0].tools) {
    const openAIobject = getStandardToolDefinition(tool);
    myTools.push(openAIobject);
  }
}

const myTools: any[] = [
  // {
  //   type: "function",
  //   function: {
  //     name: "GetCaseFile",
  //     description: "Provides the case file to the detective",
  //     parameters: {
  //       type: "object",
  //       properties: {
  //         detectiveName: {
  //           type: "string",
  //           description: "The name of the detective"
  //         },
  //         detectiveEmail: {
  //           type: "string",
  //           description: "The email address of the detective"
  //         }
  //       },
  //       required: ["detectiveName", "detectiveEmail"]
  //     }
  //   }
  // }
]

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  // await getToolsFromSnap();

  let userMessage = chatInput.value;
  if (!userMessage.trim()) {
    return;
  }

  chatInput.value = "";

  // 1. Disable the form
  chatInput.disabled = true;
  chatInput.placeholder = "Processing";




  try {
    // 1. Add user message to the UI and history
    addMessageToWindow(userMessage, "user");
    messages.push({ role: "user", content: userMessage });

    showLoadingIndicator();

    var botResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: messages,
        tools: myTools,
        tool_choice: "auto"
      })
    })

    hideLoadingIndicator();
    const data = await botResponse.json();

    if (data.error) {
      addMessageToWindow(`Error: ${data.error.message}`, "assistant");
      // Delegate handling to the finally block
      // return; // stop here if an error is found
    }


    const botMessage = data.choices[0].message;
    messages.push(botMessage); // add this response to history

    // 4. Check for tool calls
    if (botMessage.tool_calls) {
      // let toolResponses: any[] = [];
      // showLoadingIndicator(); // no need fo the loader

      for (const toolCall of botMessage.tool_calls) {
        setMostRecentTool(toolCall);

        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        // 2. Add "Tool Call" message to UI
        const toolCallMessage = `(Calling tool: ${functionName} with args: ${JSON.stringify(functionArgs)})`;
        addMessageToWindow(toolCallMessage, "tool");

        let toolResponseContent;

        try {
          // 3. Call SnapLogic API
          const toolResponse = await callSnapLogicApi(functionName, functionArgs);

          // 4. Add "Tool Output" message to UI
          const toolResponseMessage = `(Tool Response: ${JSON.stringify(toolResponse)})`;
          addMessageToWindow(toolResponseMessage, "tool");

          toolResponseContent = toolResponse;
        } catch (error) {
          console.error("Error calling tool:", error);
          const errorMessage = `(Tool: ${functionName} Error: ${error})`;
          addMessageToWindow(errorMessage, "tool");

          // Create a tool response indicating the error
          toolResponseContent = { error: "Tool call failed", details: error };
        }

        // 5. Add tool response to message history
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResponseContent)
        })
      }

      showLoadingIndicator();


      // 6. Send "updated" message history back to OpenAI
      const followUpResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: messages,
          tools: myTools,
          tool_choice: "auto"
        })
      })

      hideLoadingIndicator();
      const followUpData = await followUpResponse.json();

      if (followUpData.error) {
        addMessageToWindow(`Error: ${followUpData.error.message}`, "assistant");
      }
      else {
        // 7. Add FINAL AI message to UI and history
        const finalMessage = followUpData.choices[0].message;
        messages.push(finalMessage);
        addMessageToWindow(finalMessage.content, finalMessage.role as "assistant");
      }
    }
    else {
      // No tool calls, just display the bot message
      const botMessageContent = botMessage.content;
      const botRole = data.choices[0].message.role;
      addMessageToWindow(botMessageContent, botRole as "assistant");
    }
  }
  catch (error) {
    hideLoadingIndicator();
    console.error("Error fetching bot response:", error);
    addMessageToWindow("Sorry, there was an error processing your request.", "assistant");
  }
  finally {
    // 5. Re-enable the form
    chatInput.disabled = false;
    chatInput.placeholder = "Type your messsage...";
    chatInput.focus();
  }
})

const addMessageToWindow = (message: string, messageType: "user" | "assistant" | "tool") => {
  const textBox = document.createElement("div");
  textBox.innerText = message;
  switch (messageType) {
    case "user":
      textBox.className = "user-message";
      break;
    case "assistant":
      textBox.className = "bot-message";
      break;
    case "tool":
      textBox.className = "tool-message";
      break;
    default:
      textBox.className = "system-message";
      break;
  }
  chatWindow.appendChild(textBox);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

const showLoadingIndicator = () => {
  const textBox = document.createElement("div");
  textBox.id = "loading-message";
  textBox.className = "bot-message";
  textBox.innerText = "Thinking...";
  chatWindow.appendChild(textBox);
}

const hideLoadingIndicator = () => {
  const loadingMessage = document.getElementById("loading-message");
  if (loadingMessage) {
    chatWindow.removeChild(loadingMessage);
  }
}

// // This function simulates calling your SnapLogic REST API
// const callSnapLogicApi = async (functionName: string, args: any) => {
//   console.log("Calling SnapLogic for:", functionName, "with args:", args);

//   // This is where you would put your 'fetch' call to SnapLogic
//   // with the header token auth.

//   if (functionName === "get_user_profile") {
//     // Check if we got the username we expect
//     if (args.username === "gebobo") {
//       return { email: "gebobo@example.com", fullName: "Gebobo Smith" };
//     } else {
//       return { error: "User not found" };
//     }
//   } else if (functionName === "GetCaseFile") {
//     try {
//       const response = await fetch("https://emea.snaplogic.com/api/1/rest/slsched/feed/ConnectFasterInc/IGT_2025/Tools/GetCaseFile_APITask", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "Authorization": "Bearer 1234"
//         },
//         body: JSON.stringify(args)
//       });

//       if (!response.ok) {
//         return { error: `HTTP error! status: ${response.statusText}` };
//       }

//       const data = await response.json();
//       return data;
//     } catch (error) {
//       return { error: `Fetch error: ${error}` };
//     }
//   }
//   return { error: "Unknown function" };
// }