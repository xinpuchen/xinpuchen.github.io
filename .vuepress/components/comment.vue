<template>
  <div class="gitalk-container">
    <div id="gitalk-container"></div>
  </div>
</template>

<script>
import 'gitalk/dist/gitalk.css'
import Gitalk from 'gitalk'

export default {
  name: 'comment',
  data() {
    return {};
  },
  mounted() {
    const gitalk = new Gitalk({
      clientID: '84b20499d6de2c629a1e',
      clientSecret: '53605d7cf19e85a44e3b87f78359a853eb7e1b13',
      repo: 'xinpuchen.github.io',
      owner: 'xinpuchen',
      admin: ['xinpuchen'],
      id: location.pathname.substr(0, 50),
      distractionFreeMode: false,
    });
    gitalk.render('gitalk-container');
  },
};
</script>
