"""Publish reviewed command-course definitions, fixtures and repeatable scenarios.

Only this source course is written. Source outlines are preserved; explanations
and verification rules are independently authored, not source-private graders.
"""
import copy
import importlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COURSE = 'linux-basic-commands-practice-online'


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')


def generate():
    index = read(ROOT/'server/data/reference/linux-course-index.json')
    source = next(course for course in index['courses'] if course['id'] == COURSE)
    outlines = {lesson['source_lab_id']:lesson for lesson in read(ROOT/'server/data/reference/linux-section-outlines.json')['lessons']}
    definitions = {}
    for name in ('files', 'content', 'text'):
        patch = importlib.import_module('commands_course_'+name).build()
        assert not (definitions.keys() & patch.keys()), 'Duplicate reviewed source lesson'
        definitions.update(patch)
    plan = {'version':1, 'course_id':COURSE, 'provider':'docker', 'expected_tasks':0,
            'provenance':'Public functional requirements; independent EN/VI text and local graders. Original private VM bytes and graders are not recovered.',
            'lessons':[]}
    for stage in source['stages']:
        for item in stage['labs']:
            source_id = item['source_lab_id']
            assert source_id in definitions, f'Missing reviewed definition: {source_id}'
            definition = definitions[source_id]
            sections = []
            cases = []
            required = {s['position'] for s in outlines[source_id]['sections'] if s['need_verify']}
            assert required == set(definition['sections']), (source_id, 'Task positions differ from reference', required, set(definition['sections']))
            setup = copy.deepcopy(definition['setup'])
            assert setup.get('version') == 1
            setup.setdefault('provenance', {}).update({
                'source_url':item['source_url'], 'original_vm_bytes_recovered':False,
                'fixture_fidelity':'independently-reconstructed-from-public-functional-requirements'})
            setup.setdefault('docker', {})['image'] = 'labex-local/commands-ubuntu22:1'
            for source_section in outlines[source_id]['sections']:
                position = source_section['position']
                is_task = source_section['need_verify']
                section = {
                    'id':f'commands-{source_id}-section-{position}-v1',
                    'title':source_section['title'], 'position':position,
                    'kind':'task' if is_task else ('introduction' if position == 0 else 'summary'),
                    'layout':source_section['layout'], 'need_verify':is_task,
                    'has_solution':False}
                if is_task:
                    task = copy.deepcopy(definition['sections'][position])
                    rule = task['verification']
                    caps = task.get('capabilities', ['terminal','files','shell'])
                    if item['type'] == 'challenge':
                        # Scenarios contain independent solutions for regression
                        # testing; a challenge must present requirements instead.
                        for key in ('en', 'vi'):
                            task[key] = task[key].split('\n\n'+chr(96)*3+'bash\n', 1)[0]
                    elif chr(96)*3 not in task['en']:
                        example = '\n\n'+chr(96)*3+'bash\n'+'\n'.join(
                            command if isinstance(command,str) else command['command']
                            for command in task['commands'])+'\n'+chr(96)*3
                        task['en'] += example
                        task['vi'] += example
                    section.update(title_vi=task['title_vi'], content=task['en'], content_vi=task['vi'],
                        task=task.get('task', 'Perform the actions described above and check the result.'),
                        task_vi=task.get('task_vi', 'Thực hiện yêu cầu trong hướng dẫn và kiểm tra kết quả.'),
                        hint=task.get('hint', 'Check the paths, options and resulting state; use the terminal error message to adjust your command.'),
                        hint_vi=task.get('hint_vi', 'Kiểm tra đường dẫn, tùy chọn và trạng thái kết quả; đọc thông báo lỗi terminal để sửa lệnh.'),
                        verification=rule, required_capabilities=caps)
                    case = {'id':section['id'], 'commands':task['commands']}
                    if rule.get('kind') == 'unsupported': case['unsupported'] = True
                    if 'wait_for_pass_ms' in task: case['wait_for_pass_ms'] = task['wait_for_pass_ms']
                    cases.append(case)
                else:
                    section.update(
                        title_vi='Giới thiệu' if position == 0 else 'Tổng kết',
                        content=('Practice '+item['title']+'. Use the prepared private Linux environment. Explanations and checks here are locally authored from the linked public requirements.'
                                 if position == 0 else 'Review the command options and verify your results. Try the exercise again without copying commands.'),
                        content_vi=('Thực hành '+definition['title_vi']+'. Dùng terminal Linux riêng của bài. Hướng dẫn và bộ kiểm tra local được biên soạn lại theo yêu cầu công khai đã liên kết.'
                                    if position == 0 else 'Ôn lại tùy chọn lệnh và tự kiểm tra kết quả. Thử làm lại mà không chép lệnh mẫu.'))
                sections.append(section)
            lab = {
                'id':item['alias'], 'course_id':COURSE, 'source_lab_id':source_id,
                'source_url':item['source_url'], 'order':item['order'], 'title':item['title'],
                'title_vi':definition['title_vi'], 'type':item['type'], 'difficulty':item['difficulty'],
                'estimated_time':str(item['estimated_minutes'])+' mins',
                'required_capabilities':['terminal','files','shell','package_management'],
                'overview':'Command-line practice: '+item['title'],
                'sections':sections, 'steps':copy.deepcopy([s for s in sections if s['kind']=='task']),
                'curriculum_version':1, 'environment_setup':'server/data/environment-setups/'+item['alias']+'.json',
                'backend_audit':{'date':'2026-10-17', 'source_outline':'REA-snapshot-2026-10-16',
                    'source_requirements':'public-page-reviewed', 'prose':'independently-authored-en-vi',
                    'private_grader_recovered':False, 'integration_status':'see-current-isolated-smoke-report'}}
            write(ROOT/'server/data/labs'/(item['alias']+'.json'), lab)
            write(ROOT/lab['environment_setup'], setup)
            plan['lessons'].append({'lab_id':lab['id'], 'source_lab_id':source_id,
                                    'setup_manifest':lab['environment_setup'], 'steps':cases})
            plan['expected_tasks'] += len(cases)
    assert len(plan['lessons']) == 41 and plan['expected_tasks'] == 181
    write(ROOT/'tests/scenarios/linux-commands-course.json', plan)
    # Keep these subsets exact: the aggregator compares every task and action.
    for name, first, last in (('files', 0, 10), ('content', 10, 22), ('text', 22, 41)):
        subset = {**plan, 'source_plan':'tests/scenarios/linux-commands-course.json',
                  'lessons':plan['lessons'][first:last]}
        subset['expected_tasks'] = sum(len(lesson['steps']) for lesson in subset['lessons'])
        write(ROOT/f'tests/scenarios/linux-commands-{name}.json', subset)
    print('Commands course: 41 lessons, 263 sections, 181 task checks and matching fixtures/scenarios published.')


if __name__ == '__main__':
    generate()
