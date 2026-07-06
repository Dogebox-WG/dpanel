// Log Generator which can be provided to a WebSocketClient
// Must return a function that stops the interval.
export function mockedLogRunner(onMessageCallback: (event: { data: string }) => void) {
  // Emit a random lorem ipsum string every second
  const intervalId = setInterval(() => {
    const mockData = getRandomLorem();
    console.log('--mock runner executed');
    onMessageCallback({ data: mockData });
  }, 1000);

  // Return a function to stop the interval
  return () => clearInterval(intervalId);
}

const loremIpsum = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  "Aliqua fugiat fugiat qui aliqua nostrud dolor minim minim nostrud adipisicing duis officia culpa proident.",
  "Minim ex pariatur tempor dolore ut quis in aliquip laborum do laboris veniam in enim deserunt deserunt ex velit non mollit laboris pariatur fugiat laborum.",
  "Officia nostrud elit sint qui reprehenderit dolor consequat ad ut esse pariatur dolore ullamco do quis amet ex reprehenderit consequat in veniam labore minim veniam ex dolor tempor est enim amet cupidatat duis aliquip.",
]

const getRandomLorem = () => {
  // Select a random sentence from the array
  const selectedSentence = loremIpsum[Math.floor(Math.random() * loremIpsum.length)];
  
  // Calculate a random starting point within the selected sentence
  let start = Math.floor(Math.random() * (selectedSentence.length - 50));
  let end = start + Math.floor(Math.random() * 50) + 10;
  
  // Adjust the start to the beginning of a word
  while (start > 0 && selectedSentence[start - 1] !== ' ') {
    start--;
  }
  
  return selectedSentence.substring(start, end);
};
