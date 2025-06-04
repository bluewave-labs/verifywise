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
from typing import (
    AbstractSet,
    Dict,
    Optional,
    Tuple,
)

from .exceptions import (
    JWSEncodeError,
    JWSDecodeError,
)
from .jwa import (
    supported_signing_algorithms,
    AbstractSigningAlgorithm,
)
from .jwk import AbstractJWKBase
from .utils import (
    b64encode,
    b64decode,
)

__all__ = ['JWS']


class JWS:

    def __init__(self) -> None:
        self._supported_algs = supported_signing_algorithms()

    def _retrieve_alg(self, alg: str) -> AbstractSigningAlgorithm:
        try:
            return self._supported_algs[alg]
        except KeyError:
            raise JWSDecodeError('Unsupported signing algorithm.')

    def encode(self, message: bytes, key: Optional[AbstractJWKBase] = None,
               alg='HS256',
               optional_headers: Optional[Dict[str, str]] = None) -> str:
        if alg not in self._supported_algs:  # pragma: no cover
            raise JWSEncodeError('unsupported algorithm: {}'.format(alg))
        alg_impl = self._retrieve_alg(alg)

        header = optional_headers.copy() if optional_headers else {}
        header['alg'] = alg

        header_b64 = b64encode(
            json.dumps(header, separators=(',', ':')).encode('ascii'))
        message_b64 = b64encode(message)
        signing_message = header_b64 + '.' + message_b64

        signature = alg_impl.sign(signing_message.encode('ascii'), key)
        signature_b64 = b64encode(signature)

        return signing_message + '.' + signature_b64

    def _decode_segments(
            self, message: str) -> Tuple[Dict[str, str], bytes, bytes, str]:
        try:
            signing_message, signature_b64 = message.rsplit('.', 1)
            header_b64, message_b64 = signing_message.split('.')
        except ValueError:
            raise JWSDecodeError('malformed JWS payload')

        header = json.loads(b64decode(header_b64).decode('ascii'))
        message_bin = b64decode(message_b64)
        signature = b64decode(signature_b64)
        return header, message_bin, signature, signing_message

    def decode(self, message: str, key: Optional[AbstractJWKBase] = None,
               do_verify=True,
               algorithms: Optional[AbstractSet[str]] = None) -> bytes:
        if algorithms is None:
            algorithms = set(supported_signing_algorithms().keys())

        header, message_bin, signature, signing_message = \
            self._decode_segments(message)

        alg_value = header['alg']
        if alg_value not in algorithms:
            raise JWSDecodeError('Unsupported signing algorithm.')

        alg_impl = self._retrieve_alg(alg_value)
        if do_verify and not alg_impl.verify(
                signing_message.encode('ascii'), key, signature):
            raise JWSDecodeError('JWS passed could not be validated')

        return message_bin
