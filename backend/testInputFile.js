const { InputFile } = require("node-appwrite");
console.log("InputFile:", typeof InputFile); // Should print: "function"
console.log("fromBuffer:", typeof InputFile.fromBuffer); // Should print: "function"
