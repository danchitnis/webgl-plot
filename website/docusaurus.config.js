module.exports = {
  title: 'WebGL-Plot',
  tagline: 'API documentation',
  url: 'https://danchitnis.github.io/',
  baseUrl: '/webgl-plot/',
  favicon: 'img/favicon.ico',
  organizationName: 'danchitnis', // Usually your GitHub org/user name.
  projectName: 'webgl-plot', // Usually your repo name.
  themeConfig: {
    navbar: {
      title: 'WebGL-Plot',
      logo: {
        alt: 'My Site Logo',
        src: 'img/logo.svg',
      },
      links: [
        {to: 'docs/index', label: 'Docs', position: 'left'},
        {
          href: 'https://github.com/danchitnis/webgl-plot',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Style Guide',
              to: 'docs/index',
            },
            {
              label: 'Second Doc',
              to: 'docs/globals',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/docusaurus',
            },
            {
              label: 'Discord',
              href: 'https://discordapp.com/invite/docusaurus',
            },
          ],
        },
        {
          title: 'Social',
          items: [
            {
              label: 'Blog',
              to: 'blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/danchitnis/webgl-plot',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} webgl-plot. Built with Docusaurus.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl:
            'https://github.com/danchitnis/webgl-plot/edit/master/docs/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
