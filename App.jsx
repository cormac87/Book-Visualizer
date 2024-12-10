import { useState } from 'react';
import content from './lexcontent.js';

async function callAPI(prompt) {
  console.log("calling...");
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": 'Bearer sk-proj---'
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 10000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    return ' ';
  }
}

function App() {
  const [chapters, setChapters] = useState([]);

  async function summarize() {
    const titles_string = `0:08 – Nietzsche
      7:49 – Power and propaganda
      12:55 – Nazism
      17:55 – Religion
      34:19 – Communism
      40:04 – Hero myth
      42:13 – Belief in God
      52:25 – Advice for young people
      1:05:03 – Sex
      1:25:01 – Good and evil
      1:37:47 – Psychopathy
      1:51:16 – Hardship
      2:03:32 – Pain and gratitude
      2:14:33 – Truth
      `

    // Use a regular expression to match only the headings after the dash and space
    const headings = titles_string.match(/– (.+)/g).map(item => item.replace(/– /, '').trim());
    const names = ['Lex Fridman', 'Jordan Peterson'];
    const parts = content.split('\n');
    const chaptersArray = [];
    let currentName = 'Lex Fridman';
    chaptersArray.push({
      heading: "Jordan Peterson: Nietzsche, Hitler, God, Psychopathy, Suffering & Meaning | Lex Fridman Podcast #448",
      titles: [],
      summary: null
    })
    let currentTitle = null;
    let numbered_paragraphs = "";
    let paragraphs_store = [];
    let count = 1;
    for(const element of parts){
      if(headings.includes(element)) {
        if(currentTitle !== null){
          const paragraphs_summaries = await callAPI("summarize each paragraph, such that the meaning of it is preserved and the overall meaning of the text is preserved when reading just these summaries. Also, preserve the layout, each paragraph summary should be numbered, and ended with two line breaks.\n" + numbered_paragraphs);
          let numbered_ps = paragraphs_summaries.split('\n\n');
          const numbered_summaries = [];
          for (let k = 0; k < numbered_ps.length; k++) {
            let str = numbered_ps[k];
            let dotIndex = str.indexOf('.');
            let index = parseInt(str.substring(0, dotIndex).trim(), 10);
            let pgraph = str.substring(dotIndex + 1).trim();

            numbered_summaries.push({
              index: index,
              paragraph: paragraphs_store[index - 1].paragraph,
              summary: pgraph
            });
          }
          currentTitle.paragraphs = numbered_summaries;
          let summaries = '';
          for (const paragraph of currentTitle.paragraphs){
            summaries += paragraph.summary + '\n\n';
          }
          console.log(summaries);
          const heading_summary = await callAPI("summarize this conversation: \n " + summaries)
          currentTitle.summary = heading_summary;
          chaptersArray[0].titles.push(currentTitle)
          console.log(currentTitle);
        }

        currentTitle = {
          heading: element,
          paragraphs: [],
          summary: null
        };
        numbered_paragraphs = '';
        paragraphs_store = [];
        count = 1;
      }
      else{
        if(currentTitle !== null){
          if(names.includes(element)){
            const names = element.split(' ');
            currentName = names[0];
          }
          else{
            const cleanedText = element.replace(/^\(\d{2}:\d{2}:\d{2}\)\s*/, '');
            numbered_paragraphs += count + '. ' + currentName + ': '+ cleanedText + '\n\n';
            count++;
            paragraphs_store.push({
              paragraph: currentName + ': ' + cleanedText,
              summary: null
            });
          }
        }
      }
    }
    let heading_summaries = '';
    for(const heading of chaptersArray[0].titles){
      heading_summaries += heading.summary + '\n\n';
    }
    const episode_summary = await callAPI("summarize this podcast: \n " + heading_summaries);
    chaptersArray[0].summary = episode_summary;
    console.log(chaptersArray);
    setChapters(chaptersArray);
  }

  function saveChaptersToFile() {
    const dataStr = JSON.stringify(chapters, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = 'chapters.json';
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const contents = e.target.result;
          const loadedChapters = JSON.parse(contents);
          setChapters(loadedChapters);
          alert('Chapters loaded successfully!');
        } catch (error) {
          alert('Failed to load chapters: Invalid JSON file.');
        }
      };
      reader.readAsText(file);
    }
  }

  return (
    <>
      <button onClick={summarize}>Start</button>
      <button onClick={saveChaptersToFile}>Save Chapters</button>
      <input type="file" accept=".json" onChange={handleFileUpload} />
      <div>
        <h2>Chapters:</h2>
        <pre>{JSON.stringify(chapters, null, 2)}</pre>
      </div>
    </>
  );
}

export default App;
