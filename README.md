
<!-- TITLE/ -->

# Bevry Helper Service

<!-- /TITLE -->


<!-- BADGES/ -->

[![Build Status](https://img.shields.io/travis/bevry/bevry-helper-service/master.svg)](http://travis-ci.org/bevry/bevry-helper-service "Check this project's build status on TravisCI")<br/>
[![Gratipay donate button](https://img.shields.io/gratipay/bevry.svg)](https://www.gratipay.com/bevry/ "Donate weekly to this project using Gratipay")
[![Flattr donate button](https://img.shields.io/badge/flattr-donate-yellow.svg)](http://flattr.com/thing/344188/balupton-on-Flattr "Donate monthly to this project using Flattr")
[![PayPayl donate button](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=QB8GQPZAH84N6 "Donate once-off to this project using Paypal")
[![BitCoin donate button](https://img.shields.io/badge/bitcoin-donate-yellow.svg)](https://bevry.me/bitcoin "Donate once-off to this project using BitCoin")
[![Wishlist browse button](https://img.shields.io/badge/wishlist-donate-yellow.svg)](https://bevry.me/wishlist "Buy an item on our wishlist for us")

<!-- /BADGES -->


<!-- DESCRIPTION/ -->

A helper service that assists many of the bevry eco-system functions

<!-- /DESCRIPTION -->


<!-- INSTALL/ -->

## Install

### [NPM](http://npmjs.org/)
- Use: `require('bevry-helper-service')`
- Install: `npm install --save bevry-helper-service`

<!-- /INSTALL -->


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



<!-- HISTORY/ -->

## History
[Discover the change history by heading on over to the `HISTORY.md` file.](https://github.com/bevry/bevry-helper-service/blob/master/HISTORY.md#files)

<!-- /HISTORY -->


<!-- CONTRIBUTE/ -->

## Contribute

[Discover how you can contribute by heading on over to the `CONTRIBUTING.md` file.](https://github.com/bevry/bevry-helper-service/blob/master/CONTRIBUTING.md#files)

<!-- /CONTRIBUTE -->


<!-- BACKERS/ -->

## Backers

### Maintainers

These amazing people are maintaining this project:

- Benjamin Lupton <b@lupton.cc> (https://github.com/balupton)

### Sponsors

No sponsors yet! Will you be the first?

[![Gratipay donate button](https://img.shields.io/gratipay/bevry.svg)](https://www.gratipay.com/bevry/ "Donate weekly to this project using Gratipay")
[![Flattr donate button](https://img.shields.io/badge/flattr-donate-yellow.svg)](http://flattr.com/thing/344188/balupton-on-Flattr "Donate monthly to this project using Flattr")
[![PayPayl donate button](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=QB8GQPZAH84N6 "Donate once-off to this project using Paypal")
[![BitCoin donate button](https://img.shields.io/badge/bitcoin-donate-yellow.svg)](https://bevry.me/bitcoin "Donate once-off to this project using BitCoin")
[![Wishlist browse button](https://img.shields.io/badge/wishlist-donate-yellow.svg)](https://bevry.me/wishlist "Buy an item on our wishlist for us")

### Contributors

These amazing people have contributed code to this project:

- [Benjamin Lupton](https://github.com/balupton) <b@lupton.cc> — [view contributions](https://github.com/bevry/helper/commits?author=balupton)
- [vsopvsop](https://github.com/vsopvsop) — [view contributions](https://github.com/bevry/helper/commits?author=vsopvsop)
- [Zearin](https://github.com/Zearin) — [view contributions](https://github.com/bevry/helper/commits?author=Zearin)

[Become a contributor!](https://github.com/bevry/bevry-helper-service/blob/master/CONTRIBUTING.md#files)

<!-- /BACKERS -->


<!-- LICENSE/ -->

## License

Unless stated otherwise all works are:

- Copyright &copy; 2012+ Bevry Pty Ltd <us@bevry.me> (http://bevry.me)

and licensed under:

- The incredibly [permissive](http://en.wikipedia.org/wiki/Permissive_free_software_licence) [MIT License](http://opensource.org/licenses/mit-license.php)

<!-- /LICENSE -->


