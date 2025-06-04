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

from base64 import (
    urlsafe_b64encode,
    urlsafe_b64decode,
)
from datetime import datetime, timezone


def b64encode(s: bytes) -> str:
    s_bin = urlsafe_b64encode(s)
    s_bin = s_bin.replace(b'=', b'')
    return s_bin.decode('ascii')


def b64decode(s: str) -> bytes:
    s_bin = s.encode('ascii')
    s_bin += b'=' * (4 - len(s_bin) % 4)
    return urlsafe_b64decode(s_bin)


def uint_b64encode(value: int) -> str:
    length = 1
    rem = value >> 8
    while rem:
        length += 1
        rem >>= 8

    uint_bin = value.to_bytes(length, 'big', signed=False)
    return b64encode(uint_bin)


def uint_b64decode(uint_b64: str) -> int:
    uint_bin = b64decode(uint_b64)

    value = 0
    for b in uint_bin:
        value <<= 8
        value += int(b)
    return value


def get_time_from_int(value: int) -> datetime:
    """
    :param value: seconds since the Epoch
    :return: datetime
    """
    if not isinstance(value, int):  # pragma: no cover
        raise TypeError('an int is required')
    return datetime.fromtimestamp(value, timezone.utc)


def get_int_from_datetime(value: datetime) -> int:
    """
    :param value: datetime with or without timezone, if don't contains timezone
                  it will managed as it is UTC
    :return: Seconds since the Epoch
    """
    if not isinstance(value, datetime):  # pragma: no cover
        raise TypeError('a datetime is required')
    return int(value.timestamp())
