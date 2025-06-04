# -*- coding: utf-8 -*-
#
# Copyright 2017 Gehirn Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
from datetime import datetime, timezone
from typing import AbstractSet, Any, Dict, Optional

from jwt.utils import (
    get_time_from_int,
)
from .exceptions import (
    JWSEncodeError,
    JWSDecodeError,
    JWTEncodeError,
    JWTDecodeError,
)
from .jwk import AbstractJWKBase
from .jws import JWS


class JWT:

    def __init__(self):
        self._jws = JWS()

    def encode(self, payload: Dict[str, Any],
               key: Optional[AbstractJWKBase] = None, alg='HS256',
               optional_headers: Optional[Dict[str, str]] = None) -> str:
        if not isinstance(self, JWT):  # pragma: no cover
            # https://github.com/GehirnInc/python-jwt/issues/15
            raise RuntimeError(
                'encode must be called on a jwt.JWT() instance. '
                'Do jwt.JWT().encode(...)')
        if not isinstance(payload, dict):  # pragma: no cover
            raise TypeError('payload must be a dict')
        if not (key is None
                or isinstance(key, AbstractJWKBase)):  # pragma: no cover
            raise TypeError(
                'key must be an instance of a class implements '
                'jwt.AbstractJWKBase')
        if not (optional_headers is None
                or isinstance(optional_headers, dict)):  # pragma: no cover
            raise TypeError('optional_headers must be a dict')

        try:
            message = json.dumps(payload).encode('utf-8')
        except ValueError as why:
            raise JWTEncodeError(
                'payload must be able to be encoded to JSON') from why

        optional_headers = optional_headers and optional_headers.copy() or {}
        optional_headers['typ'] = 'JWT'
        try:
            return self._jws.encode(message, key, alg, optional_headers)
        except JWSEncodeError as why:
            raise JWTEncodeError('failed to encode to JWT') from why

    def decode(self, message: str, key: Optional[AbstractJWKBase] = None,
               do_verify=True, algorithms: Optional[AbstractSet[str]] = None,
               do_time_check: bool = True) -> Dict[str, Any]:
        if not isinstance(self, JWT):  # pragma: no cover
            # https://github.com/GehirnInc/python-jwt/issues/15
            raise RuntimeError(
                'decode must be called on a jwt.JWT() instance. '
                'Do jwt.JWT().decode(...)')
        if not isinstance(message, str):  # pragma: no cover
            raise TypeError('message must be a str')
        if not (key is None
                or isinstance(key, AbstractJWKBase)):  # pragma: no cover
            raise TypeError(
                'key must be an instance of a class implements '
                'jwt.AbstractJWKBase')

        # utc now with timezone
        now = datetime.now(timezone.utc)
        try:
            message_bin = self._jws.decode(message, key, do_verify, algorithms)
        except JWSDecodeError as why:
            raise JWTDecodeError('failed to decode JWT') from why
        try:
            payload = json.loads(message_bin.decode('utf-8'))
        except ValueError as why:
            raise JWTDecodeError(
                'a payload of the JWT is not valid JSON') from why

        # The "exp" (expiration time) claim identifies the expiration time on
        # or after which the JWT MUST NOT be accepted for processing.
        if 'exp' in payload and do_time_check:
            try:
                exp = get_time_from_int(payload['exp'])
            except TypeError:
                raise JWTDecodeError("Invalid Expired value")
            if now >= exp:
                raise JWTDecodeError("JWT Expired")

        # The "nbf" (not before) claim identifies the time before which the JWT
        # MUST NOT be accepted for processing.
        if 'nbf' in payload and do_time_check:
            try:
                nbf = get_time_from_int(payload['nbf'])
            except TypeError:
                raise JWTDecodeError('Invalid "Not valid yet" value')
            if now < nbf:
                raise JWTDecodeError("JWT Not valid yet")

        return payload
