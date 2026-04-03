import { GoogleGenAI, Type } from '@google/genai';
import {exec} from "child_process";
import util from "util";
import readlineSync from "readline-sync"
import "dotenv/config";
import os from "os";

const platform = os.platform();

const execute = util.promisify(exec);


const ai = new GoogleGenAI({apiKey:process.env.API_KEY});

async function executeCommand({command}){
   try{
    const {stdout,stderr}=await execute(command);
    if(stderr){
        return `Error : ${stderr}`
    } 
    return `Successfull : ${stdout}`;
   }catch(err){
    return `Error : ${err}`;
   }
}

const commandExecuter = {
    name:"executeCommand",
    description : "It takes any shell/terminal Commands and execute it.It help to read,write,update and delete any folder and files",
    parameters:{
        type:Type.OBJECT,
        properties :{
            command :{
                type:Type.STRING,
                description : "It is the shell/terminal commands.Example mkdir Calulator,touch Calculator/index.js" 
            }
        },
        required :["command"]
    }
}
const History =[];

async function buildWebsite() {
    while(true){
const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents:History ,
  config: { 
    systemInstruction: `You are an autonomous AI developer agent.

Your job is to build projects by calling the function "executeCommand".

You must follow these rules strictly:

1. ONLY use the function "executeCommand"
- Never explain anything
- Never return plain text
- Always respond using function calls

2. COMMAND EXECUTION STRATEGY:
- Execute ONE command at a time
- Wait for the result before continuing
- Use previous results to decide next step

3. PROJECT CREATION RULES:
- First create a folder with a proper project name
- Then create files inside it
- Then write content into files

4. FILE CREATION RULES:
- Use commands like:
  mkdir folder_name
  touch file_name
  echo "content" > file

5. HTML PROJECT RULE:
Always include:
- index.html
- style.css
- app.js

6. CODE QUALITY:
- Code must be complete and working
- Proper HTML boilerplate
- Link CSS and JS correctly

7. IMPORTANT:
- You may group related commands when necessary.

Especially for writing files:
- Always write FULL content using echo or equivalent
- Do NOT leave files empty

CRITICAL RULE:
After creating files, you MUST write complete working code into each file.
Empty files are not allowed.

Use this pattern:

echo "FULL HTML CODE" > index.html
echo "FULL CSS CODE" > style.css
echo "FULL JS CODE" > app.js

For Windows:
Use:
echo content > file

Avoid complex multi-line strings.
Write code in compact single-line format if needed.


- Do NOT chain commands using &&
- Always send ONE command per function call

8. WHEN TASK IS COMPLETE:
Return a normal text response saying "DONE"

9. ERROR HANDLING:
If a command fails:
- Fix it in next step
- Do not stop

You are like a terminal-based coding agent (like Cursor).
Also Curently using Operating System is ${platform}.So give shell/terminal command according to that`
    ,tools : [
        {
            functionDeclarations : [commandExecuter]
        }
    ]},
});

if (response.functionCalls && response.functionCalls.length > 0){

    const functionCall = response.functionCalls[0];

    const { name, args } = functionCall;

   const toolResponse=await executeCommand(args)
   History.push(response.candidates[0].content);

   

    const functionResponsePart = {
      name: functionCall.name,
      response: {
        result: toolResponse,
      },
      id: functionCall.id,
    };

    // History.push({
    //   role: "model",
    //   parts: [
    //     {
    //       functionCall: functionCall,
    //     },
    //   ],
    // });
    History.push({
      role: "user",
      parts: [
        {
          functionResponse: functionResponsePart,
        },
      ],
    });
  
}
else{
    
    console.log(response.text);
    
    History.push({
        role:"model",
        parts:[{text:response.text}]
    })
    break;
    
}
    }

}




while(true){

    const question = readlineSync.question("Ask me anything to build");
    if(question=="exit"){
        break;
    }

    History.push({
        role : "user",
        parts :[{text:question}]
    })
    await buildWebsite(question);
}
