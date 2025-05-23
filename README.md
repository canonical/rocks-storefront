# ![rockstore.io](https://user-images.githubusercontent.com/6353928/94026467-9dff1480-fdb1-11ea-8026-e866246815fc.png "Rockstore") rockstore.io codebase

Rocks are OCI-compliant artefacts, designed for the secure software supply chain, in order to provide a solid foundation for cloud-native software.


This repo is the application for the rockstore website.

The site is largely maintained by the [Web and Design team](https://ubuntu.com/blog/topics/design) at [Canonical](https://www.canonical.com). It is a stateless website project based on [Flask](https://flask.palletsprojects.com/en/1.1.x/).


## Bugs and issues

If you have found a bug on the site or have an idea for a new feature, feel free to [create a new issue](https://github.com/canonical/rocks-storefront/issues/new), or suggest a fix by [creating a pull request](https://help.github.com/articles/creating-a-pull-request/). You can also find a link to create issues in the footer of every page of the site itself.


## Local development

The simplest way to run the site locally is using [`dotrun`](https://github.com/canonical/dotrun):

```bash
dotrun
```

Once the server has started, you can visit <http://127.0.0.1:8053> in your browser. You can stop the server using `<ctrl>+c`.

For more detailed local development instructions, see [HACKING.md](HACKING.md).

## License

The content of this project is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International license](https://creativecommons.org/licenses/by-sa/4.0/), and the underlying code used to format and display that content is licensed under the [LGPLv3](http://opensource.org/licenses/lgpl-3.0) by [Canonical Ltd](http://www.canonical.com/).


With ♥ from Canonical
