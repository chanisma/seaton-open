/**
 * 파일 다운로드 유틸리티
 */
import * as XLSX from 'xlsx';

/**
 * CSV 파일을 다운로드합니다.
 * BOM을 포함하여 한글이 올바르게 표시되도록 합니다.
 *
 * @param content - CSV 내용 (문자열)
 * @param filename - 다운로드할 파일명 (.csv 확장자 포함)
 */
export function downloadCSV(content: string, filename: string): void {
  // BOM (Byte Order Mark)을 포함하여 Excel에서 한글이 올바르게 표시되도록 함
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 메모리 해제
  URL.revokeObjectURL(url);
}

/**
 * 여러 시트가 포함된 Excel(.xlsx) 파일을 다운로드합니다.
 *
 * @param sheets - { sheetName: string, data: any[][] }[] 형태의 시트 배열
 *   data는 2D 배열로 첫 행이 헤더, 이후 행이 데이터
 * @param filename - 다운로드할 파일명 (.xlsx 확장자 포함)
 */
export function downloadExcel(
  sheets: { sheetName: string; data: (string | number | null | undefined)[][] }[],
  filename: string
): void {
  const wb = XLSX.utils.book_new();

  sheets.forEach(({ sheetName, data }) => {
    const ws = XLSX.utils.aoa_to_sheet(data);
    // 시트 이름은 31자 제한, 특수문자 제거
    const safeName = sheetName.replace(/[\\/*?[\]:]/g, '').slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  });

  XLSX.writeFile(wb, filename);
}
