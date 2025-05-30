// utils/pdf-excel/GenerateSignboard.ts
import jsPDF from 'jspdf';

// Define signboard type for the utility
export type SignboardType = {
    id: string;
    title: string;
    discountPercentage: number;
    additionalText: string;
    backgroundColor: string;
    textColor: string;
    orientation: 'portrait' | 'landscape';
};

/**
 * Renders a signboard design to a canvas
 * @param canvas HTML Canvas element
 * @param signboard Signboard configuration
 * @param scale Scale factor (1 = 1mm)
 */
const renderSignboardToCanvas = (
    canvas: HTMLCanvasElement,
    signboard: SignboardType,
    scale: number = 1
) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // A5 dimensions in mm: 148 × 210
    const width = signboard.orientation === 'portrait' ? 148 * scale : 210 * scale;
    const height = signboard.orientation === 'portrait' ? 210 * scale : 148 * scale;

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = signboard.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Text styling
    ctx.fillStyle = signboard.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Title text
    const titleSize = width * 0.25;
    ctx.font = `bold ${titleSize}px Arial`;
    ctx.fillText(signboard.title, width / 2, height * 0.25);

    // Discount percentage
    const percentSize = width * 0.45;
    ctx.font = `bold ${percentSize}px Arial`;
    ctx.fillText(
        `${signboard.discountPercentage}%`,
        width / 2,
        height * 0.55
    );

    // Additional text
    const additionalTextSize = width * 0.2;
    ctx.font = `bold ${additionalTextSize}px Arial`;
    ctx.fillText(
        signboard.additionalText,
        width / 2,
        height * 0.75
    );
};

/**
 * Creates a preview canvas for a single signboard
 * @param signboard Signboard data
 * @param previewCanvasId ID of the canvas element to render to
 * @param scale Scale factor for preview (default: 2)
 */
export const previewSignboard = (
    signboard: SignboardType,
    previewCanvasId: string = 'preview-canvas',
    scale: number = 2
) => {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
        const previewCanvas = document.getElementById(previewCanvasId) as HTMLCanvasElement;
        if (previewCanvas) {
            renderSignboardToCanvas(previewCanvas, signboard, scale);
        }
    }, 100);
};

/**
 * Generate signboards PDF
 * @param signboardData Array of signboard configurations with number of copies
 * @param isPreview Whether to open in preview mode or download
 */
export const GenerateSignboard = (
    signboardData: Array<{ signboard: SignboardType, copies: number }>,
    isPreview: boolean = false
) => {
    // Make sure we have data to generate
    if (signboardData.length === 0) {
        console.error('No signboard data provided');
        return;
    }

    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5'
    });

    let pageIndex = 0;

    signboardData.forEach(({ signboard, copies }) => {
        for (let i = 0; i < copies; i++) {
            // Add a new page after the first page
            if (pageIndex > 0) {
                pdf.addPage('a5', signboard.orientation);
            }

            // Create a canvas for each signboard
            const canvas = document.createElement('canvas');
            const scale = 1; // 1mm = 1 unit in PDF

            // A5 dimensions: 148mm × 210mm
            const width = signboard.orientation === 'portrait' ? 148 : 210;
            const height = signboard.orientation === 'portrait' ? 210 : 148;

            renderSignboardToCanvas(canvas, signboard, scale);

            // Add canvas to PDF
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 0, 0, width, height);

            pageIndex++;
        }
    });

    if (isPreview) {
        // Open PDF in a new window/tab
        window.open(URL.createObjectURL(pdf.output('blob')));
    } else {
        // Download the file
        pdf.save(`signboards-${new Date().toISOString().split('T')[0]}.pdf`);
    }

    return pdf;
};