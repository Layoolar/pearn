const commands = `
<b>Available Commands:</b>

- <b>/start</b> 🚀
  - <i>Description:</i> Start your journey with Eddy and receive a warm welcome message.

- <b>/menu</b>
  - <i>Description:</i> Display all Eddy menu buttons.

- <b>/add_twitter</b>
   - <i>Description:</i> Submit your twitter username to Eddy.

- <b>/set_post [Your Message]</b> 🖋️ (Admin Only)
  - <i>Description:</i> Admins can use this command to set the post that will be shared with users using /todays_post. Click <b>Post format</b> for more info.

- <b>/submit [Your twitter post link]</b> 🖋️
  - <i>Description:</i> Post your tweet link here and receive points after Eddy has checked and verified it.

- <b>/update_admins</b> 🖋️
  - <i>Description:</i> Inform Eddy that a new administator has been added.

- <b>Help</b> ℹ️
  - <i>Description:</i> Get assistance and discover all the amazing features of Eddy.

- <b>Today's posts</b> 📢
  - <i>Description:</i> Get the latest post of the day. Admins can set it using the <b>/set_post</b> command.

- <b>Format</b>
  - <i>Description:</i> Check this format for your today's post.

- <b>My points</b> 🖋️
  - <i>Description:</i> Check your total post points here.

- <b>Quit</b> 🚪 (Admin Only)
  - <i>Description:</i> Admins can use this command to make Eddy leave a group or channel.
`;

const helpMessage = `
${commands}
`;

const initialWelcomeMessage = `
<b>Welcome to Eddy 🤖</b>

Hello there! 👋 Welcome to <b>Eddy</b>, your friendly companion in the world of awesomeness. We're thrilled to have you on board! Before you proceed, you need to provide you twitter username. To do this, use <b>/add_twitter [Your twitter username]</b>
`;

const welcomeMessage = `
<b>Your Twitter username has been updated successfully ✅.</b>
<b>Explore the commands below to unleash the full potential of Eddy</b>

${commands}

Feel free to explore and enjoy your time with Eddy! If you have any questions, use the <b>Help</b> button or reach out to our support. Have a fantastic day! 🌟
`;

const formatMessage = `
<b>Format</b>

\`\`\`
/set_post # SetPost
Tweet: "Hey friends, I am excited to announce a new project 💪🔥💻. I will be using #nodejs #typescript #firebase @firebasehq and #react @react"
Keywords: new, project, announce, friends
Hashtags: #nodejs, #typescript, #react, #firebase, #coding
\`\`\`

<b>Note</b>
- Tweet content must be placed after <b>Tweet:</b> and between ""
- All keywords and hashtags should be listed as seen above
- Hashtags: hashtag1, hashtag2 must contain the # sign.
`;

export { commands, helpMessage, initialWelcomeMessage, welcomeMessage, formatMessage };
