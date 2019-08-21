let subNav = document.querySelector('#sub-nav');
if (subNav) {
    let tags = [...document.querySelectorAll('#main-content h1, #main-content h2, #main-content h3, #main-content h4, #main-content h5,#main-content h6')];
    let items = tags.map(i => `<li class="nav-${i.tagName.toLowerCase()}"><a href="#${i.textContent.toLowerCase().replace(/\s/g, '-')}">${i.textContent}</a></li>`);
    tags.forEach(tag => {
        let a = document.createElement('a');
        a.name = tag.textContent.toLowerCase().replace(/\s/g, '-');
        tag.insertAdjacentElement('beforebegin', a);
    });
    let ul = document.createElement('ul');
    subNav.appendChild(ul);
    ul.innerHTML = items.join('');
}
