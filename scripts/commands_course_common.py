"""Shared data helpers for independently reconstructed command lessons."""
BASE = '/home/labex/project/'


def state(code):
    return {'kind': 'state', 'command': code}


def history(pattern, allowed_status=None):
    return {'kind': 'commands', 'user': 'labex',
            'groups': [[pattern]], 'allowed_status': [0] if allowed_status is None else allowed_status}


def all_checks(*rules):
    return {'kind': 'all', 'checks': list(rules)}


def file(path, content, mode='0644'):
    return {'path': path, 'content': content, 'mode': mode, 'owner': 'labex:labex'}


def directory(path):
    return {'path': path, 'owner': 'labex:labex'}
