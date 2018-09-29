window.onload = e => {
  const movieButton = document.getElementById("movie");
  const audioButton = document.getElementById("audio");
  const exit = () => window.close();

  chrome.runtime.getBackgroundPage((_?: Window) => {
    var bg = (<any>_).Background;

    // movieButton.onclick = async e => {
    //   bg.extractMovie();
    //   exit();
    // };

    audioButton.onclick = async e => {
      bg.extractAudio();
      exit();
    };
  });
};
