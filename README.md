<!-- TITLE/ -->

<h1>Bevry Helper Service</h1>

<!-- /TITLE -->


<!-- BADGES/ -->

<span class="badge-travisci"><a href="http://travis-ci.org/bevry/helper" title="Check this project's build status on TravisCI"><img src="https://img.shields.io/travis/bevry/helper/master.svg" alt="Travis CI Build Status" /></a></span>
<span class="badge-daviddm"><a href="https://david-dm.org/bevry/helper" title="View the status of this project's dependencies on DavidDM"><img src="https://img.shields.io/david/bevry/helper.svg" alt="Dependency Status" /></a></span>
<span class="badge-daviddmdev"><a href="https://david-dm.org/bevry/helper#info=devDependencies" title="View the status of this project's development dependencies on DavidDM"><img src="https://img.shields.io/david/dev/bevry/helper.svg" alt="Dev Dependency Status" /></a></span>
<br class="badge-separator" />
<span class="badge-slackin"><a href="https://slack.bevry.me" title="Join this project's slack community"><img src="https://slack.bevry.me/badge.svg" alt="Slack community badge" /></a></span>
<span class="badge-patreon"><a href="http://patreon.com/bevry" title="Donate to this project using Patreon"><img src="https://img.shields.io/badge/patreon-donate-yellow.svg" alt="Patreon donate button" /></a></span>
<span class="badge-gratipay"><a href="https://www.gratipay.com/bevry" title="Donate weekly to this project using Gratipay"><img src="https://img.shields.io/badge/gratipay-donate-yellow.svg" alt="Gratipay donate button" /></a></span>
<span class="badge-flattr"><a href="https://flattr.com/profile/balupton" title="Donate to this project using Flattr"><img src="https://img.shields.io/badge/flattr-donate-yellow.svg" alt="Flattr donate button" /></a></span>
<span class="badge-paypal"><a href="https://bevry.me/paypal" title="Donate to this project using Paypal"><img src="https://img.shields.io/badge/paypal-donate-yellow.svg" alt="PayPal donate button" /></a></span>
<span class="badge-bitcoin"><a href="https://bevry.me/bitcoin" title="Donate once-off to this project using Bitcoin"><img src="https://img.shields.io/badge/bitcoin-donate-yellow.svg" alt="Bitcoin donate button" /></a></span>
<span class="badge-wishlist"><a href="https://bevry.me/wishlist" title="Buy an item on our wishlist for us"><img src="https://img.shields.io/badge/wishlist-donate-yellow.svg" alt="Wishlist browse button" /></a></span>

<!-- /BADGES -->


<!-- DESCRIPTION/ -->

A helper service that assists many of the bevry eco-system functions

<!-- /DESCRIPTION -->


## Deploy

``` shell
rhc app create helper https://raw.githubusercontent.com/kyrylkov/openshift-iojs/master/metadata/manifest.yml

rhc alias-add -a helper helper.bevry.me
rhc alias-add -a helper helper.docpad.org
rhc alias-add -a helper helper.startuphostel.org

rhc env-set -a helper SH_API_KEY=$SH_API_KEY
rhc env-set -a helper SH_CM_KEY=$SH_CM_KEY
rhc env-set -a helper SH_CM_LIST_ID=$SH_CM_LIST_ID
rhc env-set -a helper SH_SPREADSHEET_KEY=$SH_SPREADSHEET_KEY
rhc env-set -a helper SH_SPREADSHEET_EMAIL=$SH_SPREADSHEET_EMAIL
rhc env-set -a helper SH_SPREADSHEET_PASSWORD=$SH_SPREADSHEET_PASSWORD
rhc env-set -a helper SH_FACEBOOK_GROUP_ID=$SH_FACEBOOK_GROUP_ID
rhc env-set -a helper SH_FACEBOOK_ACCESS_TOKEN=$SH_FACEBOOK_ACCESS_TOKEN
rhc env-set -a helper DP_CM_KEY=$DP_CM_KEY
rhc env-set -a helper DP_CM_LIST_ID=$DP_CM_LIST_ID
rhc env-set -a helper DP_SEGMENT_KEY=$DP_SEGMENT_KEY

rhc app deploy https://github.com/bevry/helper.git#master -a helper

rhc tail -a helper
```


## Todo

1. Get startup hostel helper going locally
1. Add environment variables and Continuous Deployment to Travis CI, like [how docpad/website does it](https://github.com/docpad/website/blob/master/.travis.yml#L45-L60).



<!-- HISTORY/ -->

<h2>History</h2>

<a href="https://github.com/bevry/helper/blob/master/HISTORY.md#files">Discover the release history by heading on over to the <code>HISTORY.md</code> file.</a>

<!-- /HISTORY -->


<!-- CONTRIBUTE/ -->

<h2>Contribute</h2>

<a href="https://github.com/bevry/helper/blob/master/CONTRIBUTING.md#files">Discover how you can contribute by heading on over to the <code>CONTRIBUTING.md</code> file.</a>

<!-- /CONTRIBUTE -->


<!-- BACKERS/ -->

<h2>Backers</h2>

<h3>Maintainers</h3>

These amazing people are maintaining this project:

<ul><li><a href="http://balupton.com">Benjamin Lupton</a></li></ul>

<h3>Sponsors</h3>

No sponsors yet! Will you be the first?

<span class="badge-patreon"><a href="http://patreon.com/bevry" title="Donate to this project using Patreon"><img src="https://img.shields.io/badge/patreon-donate-yellow.svg" alt="Patreon donate button" /></a></span>
<span class="badge-gratipay"><a href="https://www.gratipay.com/bevry" title="Donate weekly to this project using Gratipay"><img src="https://img.shields.io/badge/gratipay-donate-yellow.svg" alt="Gratipay donate button" /></a></span>
<span class="badge-flattr"><a href="https://flattr.com/profile/balupton" title="Donate to this project using Flattr"><img src="https://img.shields.io/badge/flattr-donate-yellow.svg" alt="Flattr donate button" /></a></span>
<span class="badge-paypal"><a href="https://bevry.me/paypal" title="Donate to this project using Paypal"><img src="https://img.shields.io/badge/paypal-donate-yellow.svg" alt="PayPal donate button" /></a></span>
<span class="badge-bitcoin"><a href="https://bevry.me/bitcoin" title="Donate once-off to this project using Bitcoin"><img src="https://img.shields.io/badge/bitcoin-donate-yellow.svg" alt="Bitcoin donate button" /></a></span>
<span class="badge-wishlist"><a href="https://bevry.me/wishlist" title="Buy an item on our wishlist for us"><img src="https://img.shields.io/badge/wishlist-donate-yellow.svg" alt="Wishlist browse button" /></a></span>

<h3>Contributors</h3>

These amazing people have contributed code to this project:

<ul><li><a href="http://balupton.com">Benjamin Lupton</a></li>
<li><a href="https://github.com/vsopvsop">vsopvsop</a> — <a href="https://github.com/bevry/helper/commits?author=vsopvsop" title="View the GitHub contributions of vsopvsop on repository bevry/helper">view contributions</a></li>
<li><a href="https://github.com/Zearin">Zearin</a> — <a href="https://github.com/bevry/helper/commits?author=Zearin" title="View the GitHub contributions of Zearin on repository bevry/helper">view contributions</a></li>
<li><a href="https://balupton.com">Benjamin Lupton</a> — <a href="https://github.com/bevry/helper/commits?author=balupton" title="View the GitHub contributions of Benjamin Lupton on repository bevry/helper">view contributions</a></li></ul>

<a href="https://github.com/bevry/helper/blob/master/CONTRIBUTING.md#files">Discover how you can contribute by heading on over to the <code>CONTRIBUTING.md</code> file.</a>

<!-- /BACKERS -->


<!-- LICENSE/ -->

<h2>License</h2>

Unless stated otherwise all works are:

<ul><li>Copyright &copy; 2012+ <a href="http://bevry.me">Bevry Pty Ltd</a></li></ul>

and licensed under:

<ul><li><a href="http://spdx.org/licenses/MIT.html">MIT License</a></li></ul>

<!-- /LICENSE -->
