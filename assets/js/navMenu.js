function toggleNavMenu() {
  const classes = document.getElementById('nav-menu').classList;

  classes.toggle('transition-height');
  classes.toggle('duration-500');
  classes.toggle('ease-in-out');
  classes.toggle('max-h-0');
  classes.toggle('max-h-48');
  classes.toggle('border-b-gray-700');
  classes.toggle('border-b');
}

export default function setup() {
  document.getElementById('nav-menu-button').addEventListener('click', toggleNavMenu);
}
