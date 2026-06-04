Used AI for scheduled_tasks.md.
Prompt:
```
Provided is an outline for our project. Cluster tasks by things we can do concurrently, and sort these clusters from start to finish. Evenly distribute the roles between frontend and backend. Alex Lin, Alex Markova, Priyam Rangwala, Harry Yu, Hao Gu:
[Insert the Assigned Planning Document Here]
```

Used AI for updated_scheduled_tasks.md.
Prompt:
```
One teammate, Hao Gu, has dropped the class, so we need to redistribute his work while avoiding overlap and merge conflicts. Read the BruinBet repository carefully, especially scheduled_tasks.md, to determine what has already been done, what still needs to be done, and what needs fixing. Also compare the original schedule against the project rubric to determine whether it is sufficient for full credit or whether more tasks need to be added.

Create a new markdown plan called updated_scheduled_tasks.md. The plan should keep in mind that the team is currently around clusters 2 and 3, today is Thursday of Week 7, and the presentation is Friday of Week 10. The new plan should finish around the same time, use file/module ownership to avoid merge conflicts, include the missing rubric work such as README, diagrams, Playwright end-to-end tests, security, server-side search, and documentation, and de-scope optional work if needed.
```

Used AI for the Prod stress test script. Discovered that sqlite could not keep up with lots of concurrent database queries. No solution as of now. The prompt was: Create a script to stress test our production environment using python and curl. Do the following in parallel, with 20 at a time: Register users and have them place bets, where the market which they are placing bets in is selected with a regex passed as a parameter. The default regex should be "tobias". 

Used AI to implement a recommendation engine and recommended market tagging. More details and reflection in market_recs_prompt_and_analysis.md 
