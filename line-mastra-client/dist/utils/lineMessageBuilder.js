export function buildSubsidySelectionMessage(subsidies) {
    // 補助金が1つの場合：確認ボタン
    if (subsidies.length === 1) {
        return {
            type: 'template',
            altText: '補助金が見つかりました',
            template: {
                type: 'confirm',
                text: `${subsidies[0].name}が見つかりました。申請条件を確認しますか？`,
                actions: [
                    {
                        type: 'postback',
                        label: 'はい',
                        data: `action=select&subsidyId=${subsidies[0].id}`
                    },
                    {
                        type: 'postback',
                        label: 'いいえ',
                        data: 'action=cancel'
                    }
                ]
            }
        };
    }
    // 複数の場合：選択肢リスト + 「調べない」オプション
    const contents = [
        {
            type: 'text',
            text: '該当する補助金が見つかりました',
            weight: 'bold',
            size: 'md'
        },
        {
            type: 'text',
            text: '詳細を確認したい補助金を選択してください',
            size: 'sm',
            margin: 'md'
        },
        {
            type: 'separator',
            margin: 'lg'
        }
    ];
    // 各補助金の選択ボタンを追加
    subsidies.forEach((subsidy, index) => {
        contents.push({
            type: 'button',
            action: {
                type: 'postback',
                label: `${index + 1}. ${subsidy.name}`,
                data: `action=select&subsidyId=${subsidy.id}`
            },
            margin: 'sm'
        });
    });
    // 「調べない」オプションを追加
    contents.push({
        type: 'button',
        action: {
            type: 'postback',
            label: '申請できるかどうかを調べない',
            data: 'action=cancel'
        },
        margin: 'md'
    });
    return {
        type: 'flex',
        altText: '補助金を選択してください',
        contents: {
            type: 'bubble',
            body: {
                type: 'box',
                layout: 'vertical',
                contents: contents
            }
        }
    };
}
