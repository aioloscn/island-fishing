// 中文招牌沿用 StallKit.ATLAS 的区域，避免改变摊位网格的 UV。
// node tools/props/signs.mjs；需要 ImageMagick（magick）及本机中文字体。
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname( fileURLToPath( import.meta.url ) );
const OUT = path.join( HERE, '../../public/models/props/signs.png' );
const escapeXml = ( s ) => String( s ).replace( /[&<>"']/g, ( c ) => ( { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[ c ] ) );

export function createSignSvg( fontFamily = 'Microsoft YaHei, PingFang SC, Noto Sans CJK SC, sans-serif' ) {

	const ticks = [], numbers = [];
	for ( let i = 0; i <= 50; i ++ ) {

		const a = ( - 150 + i * 6 ) * Math.PI / 180;
		const r0 = i % 10 === 0 ? 170 : i % 2 === 0 ? 186 : 194;
		ticks.push( `<line x1="${ 1792 + Math.sin( a ) * r0 }" y1="${ 768 - Math.cos( a ) * r0 }" x2="${ 1792 + Math.sin( a ) * 210 }" y2="${ 768 - Math.cos( a ) * 210 }"/>` );

	}
	for ( let i = 0; i <= 5; i ++ ) {

		const a = ( - 150 + i * 60 ) * Math.PI / 180;
		numbers.push( `<text x="${ 1792 + Math.sin( a ) * 128 }" y="${ 768 - Math.cos( a ) * 128 + 18 }">${ i * 5 }</text>` );

	}
	return `<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="1024" viewBox="0 0 2048 1024">
		<g font-family="${ escapeXml( fontFamily ) }">
			<g fill="#e2a53a"><ellipse cx="64" cy="130" rx="44" ry="22"/><path d="M100 130 134 106 134 154Z"/>
				<ellipse cx="1968" cy="130" rx="50" ry="24"/><path d="M1928 130 1898 104 1898 156Z"/></g>
			<g text-anchor="middle" font-weight="700">
				<text x="1024" y="180" fill="#f1ead6" font-size="152">乔的鲜鱼摊</text>
				<text x="737" y="373" fill="#f4e7c4" font-size="96">玛尔塔的船具店</text>
				<text x="737" y="472" fill="#e8b04a" font-size="62">鱼饵 · 渔具 · 燃油</text>
			</g>
			<g fill="#ecebe4" font-size="46">
				<text x="60" y="618" font-size="74" font-weight="700">今日收购</text>
				<text x="70" y="710">红笛鲷 ........... $18/kg</text>
				<text x="70" y="780">猪齿鱼 ........... $16/kg</text>
				<text x="70" y="850">黄尾笛鲷 ......... $12/kg</text>
				<text x="70" y="920">石鲈 $7/kg    鲹 $6/kg</text>
				<text x="70" y="990">金枪鱼／鲯鳅：询问乔</text>
			</g>
			<circle cx="1792" cy="768" r="232" fill="#e9e4d6"/>
			<g stroke="#1c1c1c" stroke-width="5">${ ticks.join( '' ) }</g>
			<g fill="#1c1c1c" text-anchor="middle" font-size="52">${ numbers.join( '' ) }
				<text x="1792" y="852" font-size="40">kg</text></g>
		</g>
	</svg>`;

}

export function buildSigns() {

	const svg = path.join( HERE, '.signs.svg' );
	fs.writeFileSync( svg, createSignSvg( process.env.SIGN_FONT_FAMILY ), 'utf8' );
	try {

		execFileSync( 'magick', [ '-background', 'none', svg, 'PNG32:' + OUT ], { stdio: 'inherit' } );
		console.log( '已生成中文 signs.png' );

	} finally {

		fs.unlinkSync( svg );

	}

}

if ( process.argv[ 1 ] && path.resolve( process.argv[ 1 ] ) === fileURLToPath( import.meta.url ) ) buildSigns();
