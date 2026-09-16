# Australian locality lookup

`au-localities.json` is derived from the GeoNames Australian postal-code download:
https://download.geonames.org/export/zip/AU.zip

Downloaded 16 September 2026. Source AU.txt SHA-256:
`fd55e4cd2a4256a1ba243f6e270c463a36705a4928ca42bc5d428aeee056ad06`.

Copyright GeoNames and contributors. Licensed under Creative Commons Attribution
4.0: https://creativecommons.org/licenses/by/4.0/ . Dataset documentation:
https://download.geonames.org/export/zip/readme.txt . No endorsement is implied.

Transformation: retain only postcode and locality; preserve leading zeros,
deduplicate names per postcode, sort, and join each postcode's names with `|`.
Coordinates and other fields are discarded. The client downloads this as a
separate cached JSON asset; the server bundles the same index. No customer
address is sent to GeoNames. The booking form includes attribution.

This is a locality match, not proof that a street/property or customer exists.
New developments or source omissions need data correction, not a silent bypass.
Review/update the snapshot before launch and when legitimate mismatches are
reported. Test representative regions, leading-zero postcodes and aliases after
each update. Street verification and email/phone ownership need a dedicated
address provider and confirmation flow respectively.
