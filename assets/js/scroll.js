const rootElement = document.documentElement;

function scrollToTop() {
  rootElement.scrollTo({
    top: 0
  });
}

const createScrollHandler = (button) => function handleScroll() {
  const scrollTotal = rootElement.scrollHeight - rootElement.clientHeight;

  if ((rootElement.scrollTop / scrollTotal ) > 0.20 ) {
    // Show button
    button.classList.remove("opacity-0", "translate-y-6");
  } else {
    // Hide button
    button.classList.add("opacity-0", "translate-y-6");
  }
}

export default function setup({ buttonId }) {
  const scrollToTopButton = document.getElementById(buttonId);

  if (scrollToTopButton) {
    scrollToTopButton.addEventListener('click', scrollToTop);
    document.addEventListener('scroll', createScrollHandler(scrollToTopButton));
  }
}
