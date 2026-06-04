Prompt:
You are a senior software engineer with experience in full-stack development using Node.js, Express, and React. Ensure that you mark all code you generate for this prompt as AI-generated, denoted by comments for where all AI-generated code starts and ends. Don't just mark big chunks of code as AI-generated. You must mark each small chunk of code you add to all files as AI-generated. Be granular about it. Before you start writing code, all of which should be marked granularly with AI-generated comment disclaimers, ask me in this chat for any ambiguities about the instructions I am giving you, before proceeding. 

Your task is to implement an algorithm my group and I thought of for tagging certain markets as recommended for you. This would be personalized per user. You are to use the existing code for tagging markets. For instance, the existing code for tagging market tags on the top left and top right of each market preview in the market shopping screen. The recommended tag should be right next to the open tag, and it should be orange. 

To recommend a market for a user, you should look at what percent of the user's bets are for some market category. You should be looking at the percentage breakdown of what categories a user has bet in historically. For the bet market with the largest plurality, you will deliver that as recommended, and the frontend will handle tagging it.

You should create a new Express route in a new file in the routes directory and name it recommendations.js.


The process:

Immediately after sending the prompt, the AI adhered to my instructions to clarify ambiguities and asked the following clarifying questions:
- Should the recommendation endpoint return market IDs only or return full market objects?
- Should recommendations include only open markets, or can expired/closed markets be recommended too? I assume only open markets
- If the user has no betting history, what should happen?
- When the user’s top category is found, should all open markets in that category be tagged recommended, or only some subset like the top 3?
- Should markets the user has already bet on be excluded from recommendations, or can they still be recommended?
- Do you want me to implement only the backend route server/routes/recommendations.js, or also wire it into routes/index.js and add the frontend “Recommended” orange tag?

My answers were, respectively:
- The recommendation endpoint should return just the market IDs to fulfill the security principle of delivering the least amount of information that the client needs to function. 
- The recommendation should only include open markets because expired and closed markets are redundant for this feature.
- Just the top three in terms of market volume, where market volume is measured by the total currency amount of bets placed in a market.
- If the user has no betting history, recommend the top three in terms of market volume, where market volume is the same as defined above.
- Markets that the user has bet on can be recommended.
- Wire into index.js as well. And add the recommended orange tag.

After clarifying the ambiguities, the agent acting as a senior software engineer with experience in full-stack development using Node.js, Express, and React began development. Below are some reflections of the AI-generated code. 
The AI did an incredibly good job, and I believe a big part of this is because I asked it to clarify ambiguities. I had no changes to make to any of the code the AI generated. So here's a reflection on why I think the AI-generated code did well.
- It did a good job in creating variables and marking them constant when they wouldn't change
- It also did a good job following the precedent we've set in our codebase already. For example, it followed the style of parentheses, braces, variable names, and function names, etc.
- It made minimal changes and clearly marked what was AI-generated.
- The CSS and styling fit the precedent of what we've established throughout the codebase. 
